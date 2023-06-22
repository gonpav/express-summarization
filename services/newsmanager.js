require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const { NewsSourceProcessor } = require('./newssource-processor.js');
const { RssNewsSourceProcessor } = require('./rssnewssource-processor.js');
const { NewsSource } = require('../models/newsSource.js');

// NewsManager class that holds all temporary data on news getting, parsing and summarization.
// const newsManager = new NewsManager();
const newsManager = new class{
// class NewsManager {
    constructor() {
        this._reset();
        this._loadSources();
    }

    initializeDB(dbConnection){
        this._db = dbConnection;
    }

    _reset() {
        this.sources = [];
        // this.articles = [];
        this.curFetchingSource = null;
    }

    async processSources(urls) {
        // Delete all currently stored sources and start  
        // processing of the new 'urls'
        this._reset();

        let promises = [];
        urls.forEach(async url => {
            const newsSource = this.createNewsSource(url);
            this.sources.push(newsSource);
            // promises.push(newsSource.download());
        });
        return Promise.all(promises)
        .catch((err) => {
            console.log(err);
            throw err;
        })
        .finally(async () => {
            this._saveSources(); 
        });
    }

    createNewsSource(url){
        // This is Factory method to get instance of NewsSource class;
        if (url && (url.toLowerCase().includes("rss") || url.toLowerCase().includes("feed"))){
            if (url.toLowerCase().includes("macworld.com")){
                return new RssNewsSourceProcessor(url, false);
            }
            return new RssNewsSourceProcessor(url, true);
        }
        return new NewsSourceProcessor(url, true);
    }

    processSourcesStatus(){
        if(!this.sources){
            return { jobsCount: 0, currentJob: 0,  message: `No jobs added` };
        }
        // get number of this.sources that are finished
        const finishedJobsCount = this.sources.filter(source => source.fetchingSourceFinished).length;

        if (finishedJobsCount === this.sources.length){
            const failedJobs = this.sources.filter(source => source.fetchingSourceFinished && !source.fetchingSourceSuccess);
            let message = `All ${this.sources.length} sources done. Failed sources: ${failedJobs.length}`;
            if (failedJobs.length){
                // For all this.sources that failed to get articles we need to add error message to the message
                const array = failedJobs.map(job => `${job.name}: ${job.lastError}`);
                message += '\n';
                message += array.join('\n');
                //console.log(array);
            }
            const successfulJobs = this.sources.filter(source => source.fetchingSourceFinished && source.fetchingSourceSuccess);
            message += `\nSuccessful sources: ${successfulJobs.length}`;
            const array = successfulJobs.map(job => `${job.name}: Articles extracted: ${job.articles.length}, raw data length: '${job.data.length}' characters`);
            message += '\n';
            message += array.join('\n');
            //console.log(array);
            return { jobsCount: this.sources.length, currentJob: finishedJobsCount,  message: message };
        }
        else {
            return { jobsCount: this.sources.length, currentJob: finishedJobsCount,  message: `Left to process ${this.sources.length - finishedJobsCount} sources...` };
        }
    }

    fetchNextNewsSourceArticles() {
        this.curFetchingSource = this._nextNewsSourceToFetchArticles();
        if (this.curFetchingSource) {
            this.curFetchingSource.downloadArticles().then(() => {
                console.log(`Articles downloaded from '${this.curFetchingSource.name}'`);
            });    
        }
        return this.curFetchingSource;
    }

    _nextNewsSourceToFetchArticles() {
        // get all this.sources that are not finished
        const notExtractedSources = this.sources.filter(source => source.fetchingSourceFinished && source.fetchingSourceSuccess && !source.fetchingArticlesFinished);
        // get the first not finished this.source
        return notExtractedSources && notExtractedSources.length > 0 ? notExtractedSources[0] : null;
    }
    
    resetFetchingArticlesCurrentNewsSource (){
        if(this.curFetchingSource && this.curFetchingSource.fetchingArticlesFinished){
            this.curFetchingSource = null;
            return true;
        }
        return false;
    }

    processArticlesStatus(){
        function extendMessageWithNextSource(message, nextSource){
            if (nextSource) {
                message += `\nPress 'Load Articles' to download articles from '${nextSource.name}'`;
            }
            return message;
        }

        if(!this.curFetchingSource){
            const message = extendMessageWithNextSource(`No articles are currently downloaded`, this._nextNewsSourceToFetchArticles());
            return { jobsCount: 0, currentJob: 0,  message: message };
        }
        else if(this.curFetchingSource.fetchingArticlesFinished){
            const message = extendMessageWithNextSource(`Finished downloading articles from '${this.curFetchingSource.name}'`, this._nextNewsSourceToFetchArticles());
            return { jobsCount: 0, currentJob: 0,  message: message, articles: this.curFetchingSource.articles };

        }
        else {
            return { jobsCount: 1, currentJob: 0,  message: `Still downloading articles from '${this.curFetchingSource.name}'. Please wait...` };

        }
    }  
    
    async _saveSources() {
        this._saveSourcesToFile();
        this._saveSourcesToMongoDB();
    }

    async _loadSources() {
        this._loadSourcesFromFile();
    }

    // Get array of newsSources which 'url' field may equal to this.sources[i].url. 


    async _saveSourcesToMongoDB() {

        const newsSources = this.sources.map(x => x.toNewsSource());

        // Bulk update all newsSources in the database
        let bulkOps = newsSources.map(newsSource => ({
            updateOne: {
                filter: { url: newsSource.url },
                update: { $set: newsSource },
                options: { upsert: true, new: true }
            }
        }));

        NewsSource.bulkWrite(bulkOps).then(res => {
            if(res.ok){
                NewsSource.find({ url: { $in: newsSources.map(source => source.url) } }).then(async (dbNewsSources) => {
                    dbNewsSources.forEach(async (dbNewsSource) => {
                        // Update this.sources with latest data from the MongoDB
                        const localSourceProcessor = this.sources.find(source => source.url.href === dbNewsSource.url);
                        localSourceProcessor.fromNewsSource(dbNewsSource);
                        console.log(localSourceProcessor);
                    });        
                })                
            }
        })
        .catch(err => {
            console.log(err)
        });
    }

    // saveSources function saves this.sources in sourcesdb.json file   
    _saveSourcesToFile() {
        if (!this.sources) return;

        const serializedObjects = this.sources.map((obj) => {
          const className = obj.constructor.name;
          const serializedData = JSON.stringify(obj.saveToConfig());
          return { className, data: serializedData };
        });
      
        const json = JSON.stringify(serializedObjects, null, 2);
        
        const filename = __dirname + `/${process.env.SOURCESDB_DIR}/${process.env.SOURCESDB_FILE}`;
        fs.writeFileSync(filename, json);
    }
    
    _loadSourcesFromFile() {
        // const obj = new RssNewsSource("https://some.com", false);
        // obj.newMethod();
        // return;
        
        // We do NOT load sources from the Database if there were loaded previously. 

        if (this.sources && this.sources.length > 0) return;

        const filename = __dirname + `/${process.env.SOURCESDB_DIR}/${process.env.SOURCESDB_FILE}`;

        if (!fs.existsSync(filename)) return;

        const json = fs.readFileSync(filename, 'utf8');
        const serializedObjects = JSON.parse(json);
      
        const objects = serializedObjects.map((serializedObj) => {
          const className = serializedObj.className;
          const data = JSON.parse(serializedObj.data);
      
          switch (className) {
            case 'NewsSourceProcessor':
              return new NewsSourceProcessor(data.url, data.requireFetchArticles);
      
            case 'RssNewsSourceProcessor':
              return new RssNewsSourceProcessor(data.url, data.requireFetchArticles);
      
            // Add more cases for other classes if necessary
      
            default:
              throw new Error(`Unknown class: ${className}`);
          }
        });
      
        this.sources = objects;
        for (let index = 0; index < this.sources.length; index++) {
            const source = this.sources[index];
            source.loadFromConfig();            
        }
    }
}

module.exports = newsManager;
