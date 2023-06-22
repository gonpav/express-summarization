require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const { URL } = require('url');
const { JSDOM } = require("jsdom");
const { Readability } = require('@mozilla/readability');

class NewsSourceProcessor {
    constructor(urlString, requireFetchArticles){
        if(urlString){
            this.url = new URL(urlString);
            this.name = this.url.hostname;
        }
        this.data = null;
        this.articles = [];
        this.fetchingSourceSuccess = false;
        this.fetchingSourceFinished = urlString ? false : true; // if urlString incorrect then we consider finished withe error
        this.lastError = urlString ? '' : `Incorrect URL: '${urlString}'`;
        this.requireFetchArticles = requireFetchArticles;
        this.fetchingArticlesSuccess = false;
        this.fetchingArticlesFinished = false;
    }

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

    async downloadArticle(article){
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
                // reject(error); // we will not reject to avoid downloading other articles
                article.contentData = null;
                article.lastError = error.message;
            });
        });
    }   

    async downloadArticles(){
        let promises = [];
        this.articles.forEach(async article => {
            promises.push(this.downloadArticle(article));
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
            });
    }

    _castSourceItemsToArticles(sourceDataItems) {
        if (!sourceDataItems || sourceDataItems.length == 0){
            return null;
        }
        return sourceDataItems.map(feedObject => {
            return {
                title: feedObject.title,
                link: feedObject.link || feedObject.url,
                author: feedObject.creator || feedObject.author,
                pubDate: feedObject.pubDate || feedObject.publishedAt,
                contentSnippet: feedObject.contentSnippet || feedObject.content
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
