require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const { URL } = require('url');
const { JSDOM } = require("jsdom");
const { Readability } = require('@mozilla/readability');
const { NewsSourceType } = require('../models/newsSource.js');
const { Article } = require('../models/article.js');

class NewsSourceProcessor {
    constructor(urlString, requireFetchArticles){
        if(urlString){
            this.url = new URL(urlString);
            this.name = this.url.hostname;
        }
        this.idRef = null; // this MongoDB id reference
        this.type = NewsSourceType.ApiFeed;
        this.data = null;
        this.articles = [];
        this.fetchingSourceSuccess = false;
        this.fetchingSourceFinished = urlString ? false : true; // if urlString incorrect then we consider finished withe error
        this.lastError = urlString ? '' : `Incorrect URL: '${urlString}'`;
        this.requireFetchArticles = requireFetchArticles;
        this.fetchingArticlesSuccess = false;
        this.fetchingArticlesFinished = false;
    }

    async download(){
        return new Promise((resolve, reject) => {
            axios.get(this.url.href)
            .then(response => {
                this._saveSourceData(response.data, response.data.articles);
                this.fetchingSourceSuccess = true;
                //console.log(this.articles);
                resolve();
            })
            .catch(error => {
                this.fetchingSourceSuccess = false;
                this.lastError = error.message;
                console.error(error);
                // reject(error); // No need to reject as other sources still can contine to work
            })
            .finally(() => { 
                this.fetchingSourceFinished = true; 
            });
        });
    }   

    async downloadArticles(){
        return this._removeFetchedArticles().then(async () => {
            let promises = [];
            this.articles.forEach(async article => {
                promises.push(this._downloadArticle(article));
            });
            return Promise.all(promises)
                .then(() => {
                    this.fetchingArticlesSuccess = true;
                })
                .catch((err) => {
                    console.log(err);
                    this.fetchingArticlesSuccess = false;
                    // throw err;
                })
                .finally(() => { 
                    this.fetchingArticlesFinished = true; 
                    this._saveArticles();
                });
        });
    }

    async _downloadArticle(article){
        // internal function to assign data to article.contentData
        function assignContentData(article, data, sourceName){
            const sourcesdir = process.env.SOURCESDB_DIR;
            NewsSourceProcessor._saveToFile(article.title.replace(/[^a-zA-Z0-9\.\-_]/g, '').substring(0,10), `${sourcesdir}/${sourceName}`, data, 'txt');                    
            article.contentData = data;
            article.lastError = null;
        }

        return new Promise((resolve, reject) => {
            if(!this.requireFetchArticles){
                // For articles that are already preloaded with the feed just assign 'content' to 'contentData'
                assignContentData(article, article.contentSnippet, this.name);
                resolve();
                return;
            }
            // otherwise fetch the data
            axios.get(article.link)
            .then((response) => {
                const data = response.data;
    
                // Extract text from the web-page using JavaScript's DOMParser.
                let text = this._preprocessHTML(data);
                assignContentData(article, text, this.name);
                resolve();
            })
            .catch(error => {
                console.error(error);                
                article.contentData = null;
                article.retryCount += 1;
                article.lastError = error.message;
                resolve(); // we will not reject() but resolve() to continue downloading other articles
            });
        });
    }   

    _castSourceItemsToArticles(sourceDataItems) {
        if (!sourceDataItems || sourceDataItems.length == 0){
            return null;
        }
        return sourceDataItems.map(feedObject => {
            // Sort of c-tor of the ArticleDTO
            return {
                title: feedObject.title,
                link: feedObject.link || feedObject.url,
                author: feedObject.creator || feedObject.author,
                pubDate: feedObject.pubDate || feedObject.publishedAt,
                contentSnippet: feedObject.contentSnippet || feedObject.content,
                retryCount: 0   // Important to initialize this with 0 here
                }
            });
    }

    _preprocessHTML(html) {
        const dom = new JSDOM(html);
        const document = dom.window.document;      
        const reader = new Readability(document);
        const article = reader.parse();      
        return article.textContent.replace(/\s+/g, " ").trim();
    }

    calculateHash() {
        if (!this.articles) return null;

        // Sort the array
        let arr = this.articles.map(x => x.url);
        arr.sort();
    
        // Concatenate the sorted strings into one
        let str = arr.join('');
    
        // Create a hash of the string
        let hash = crypto.createHash('sha256');
        hash.update(str);
    
        // Return the hexadecimal representation of the hash
        return hash.digest('hex');
    }

    toNewsSource() {
        return {
            url: this.url.href,
            preloadedContent: !(this.requireFetchArticles),
            type: this.type,
            lastQueryDate: new Date()
            // lastQueryHash: this.calculateHash()
        };
    }

    fromNewsSource(newsSource) {
        this.idRef = newsSource._id;
        this.url = new URL(newsSource.url);
        this.name = this.url.hostname;
        this.requireFetchArticles = !(newsSource.preloadedContent);
        this.type = newsSource.type;
        this.lastQueryDate = newsSource.lastQueryDate; 
    }

    async _removeFetchedArticles() {
        if (!this.idRef) throw new Error(`The source ${this.name} is not initialized with idRef`);

        const MAX_RETRY_COUNT = 3;

        return new Promise((resolve, reject) => {
            
            Article.find({ 
                sourceId: this.idRef,
                link: { $in: this.articles.map(article => article.link) } 
            }).then(async (dbArticles) => {
                let newArticles = [];

                // iterate over this.articles, find articles with the same 'link' in dbArticles,
                // and update the article with the latest data from the MongoDB. 
                // For those this.articles that were not found in the MongoDB or have no 'contentData' (retried less than 3 times)
                // leave them in this.articles for further contentData fetching
                this.articles.forEach(async (localArticle) => {
                    const dbArticle = dbArticles.find(article => article.link === localArticle.link);
                    if (dbArticle) {
                        localArticle.idRef = dbArticle._id;
                        localArticle.retryCount = dbArticle.retryCount;
                    }
                    if (!dbArticle || (!dbArticle.contentData && dbArticle.retryCount < MAX_RETRY_COUNT)) {
                        newArticles.push(localArticle);
                    }
                });
                // Reassign articles to those that we actually need to fetch 'contentData'
                this.articles = newArticles;
                resolve();
            })
            .catch(error => {
                console.error(error);
                resolve(); // still resolve to continue.
            })   
        });
    }

    _toArticle(localArticle) {
        let dbArticle = {
            title: localArticle.title,
            link: localArticle.link,
            author: localArticle.author,
            publishedDate: localArticle.pubDate,
            lastQueryDate: new Date(), 
            contentData: localArticle.contentData,
            retryCount: localArticle.retryCount,
            lastError: localArticle.lastError,
            sourceId: this.idRef
        };
        if (localArticle.idRef) {
            dbArticle._id = localArticle.idRef;
        }
        return dbArticle;       
    }

    _fromArticle(dbArticle) {
        return {
            idRef: dbArticle._id,
            title: dbArticle.title,
            link: dbArticle.link,
            author: dbArticle.author,
            pubDate: dbArticle.publishedDate,
            lastQueryDate: dbArticle.lastQueryDate,
            contentData: dbArticle.contentData,
            retryCount: dbArticle.retryCount,
            lastError: dbArticle.lastError,
            sourceId: dbArticle.sourceId,
            }
    }

    async _saveArticles() {
        const dbArticles = this.articles.map(x => this._toArticle(x));
        // Bulk update all Articles in the database
        let bulkOps = dbArticles.map(article => ({
            updateOne: {
                filter: { sourceId: article.sourceId /*this.idRef*/, link: article.link },
                update: { $set: article },
                upsert: true 
            }
        }));     

        Article.bulkWrite(bulkOps).then(res => {
            if(res.ok){
                // Probably next code is not required at all!!! It is here for testing purposes
                Article.find({ sourceId: this.idRef, link: { $in: this.articles.map(article => article.link) } }).then(async (dbArticlesRes) => {
                    dbArticlesRes.forEach(async (dbArticle) => {
                        // Update this.articles with latest data from the MongoDB
                        let localArticle = this.articles.find(article => article.link === dbArticle.link);
                        const index = this.articles.indexOf(localArticle);
                        if(index !== -1) {
                            localArticle = this._fromArticle(dbArticle);
                            this.articles[index] = localArticle;
                            //console.log(localArticle);
                            //console.log(this.articles.find(article => article.link === dbArticle.link));
                        }
                        else {
                            console.log(`Error: failed to update article from DB: ${localArticle.title}`);
                        }
                    });        
                })                
            }
        })
        .catch(err => {
            console.log(err)
        });           
    }
    ///////////////////////////////////////////////////////////////////////////////////
    // Data IO
    ///////////////////////////////////////////////////////////////////////////////////

    saveToConfig() {
        // Exclude non-serializableProp from serialization
        return {
          // name: this.name,
          url: this.url.href,
          requireFetchArticles: this.requireFetchArticles,
        };
    }

    loadFromConfig() {
        // Find file with this.name and load its content
       this._loadSourceData(true);
    }

    _saveSourceData(sourceData, sourceDataItems){
        this.data = sourceData;
        this.articles = this._castSourceItemsToArticles(sourceDataItems);
        
        const sourcesdir = process.env.SOURCESDB_DIR; 

        if (this.articles && this.articles.length > 0) {
            NewsSourceProcessor._saveToFile(this.name, sourcesdir, JSON.stringify (this.articles), 'json');
        }
        else {
            NewsSourceProcessor._saveToFile(this.name, sourcesdir, this.data, 'txt');
        }
    }

    _loadSourceData(loadContentData){
        const sourcesdir = process.env.SOURCESDB_DIR;
        let content = NewsSourceProcessor._loadFromFile(this.name, sourcesdir, 'json');
        if (!content){
            content = NewsSourceProcessor._loadFromFile(this.name, sourcesdir, 'txt');
            if(content) {
                this.data = content;
            }
        } 
        else {
            const source = JSON.parse(content);
            this.articles = source;
            if (loadContentData && this.articles){
                for (let index = 0; index < this.articles.length; index++) {
                    const article = this.articles[index];
                    article.contentData = NewsSourceProcessor._loadFromFile(article.title.replace(/[^a-zA-Z0-9\.\-_]/g, '').substring(0,10), `${sourcesdir}/${this.name}`, 'txt');    
                }
            }
        }
    }

    static _saveToFile(fileName, dirName, data, ext = 'txt'){
        
        const directoryPath = __dirname + `/${dirName}`;
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
          }

        const file = fs.createWriteStream(`${directoryPath}/${fileName}.${ext}`);
        file.write(data);         
    }

    static _loadFromFile(fileName, dirName, ext){
        const filePath = __dirname + `/${dirName}/${fileName}.${ext}`;
        if (!fs.existsSync(filePath)) {
            return null;
        }
        return fs.readFileSync(filePath, 'utf8');
    }
}

module.exports = {
	NewsSourceProcessor: NewsSourceProcessor,
};
