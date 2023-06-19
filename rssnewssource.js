const { NewsSource } = require('./newssource.js');
const Parser = require('rss-parser');

const parser = new Parser();

// title
// link
// comments
// <pubDate>Thu, 25 May 2023 12:45:41 PDT</pubDate>
// <guid isPermaLink="false">https://www.macrumors.com/2023/05/25/united-airlines-live-activities/</guid>
// <dc:creator>Juli Clover</dc:creator>
// <category>Live Activities</category>
// <category>Dynamic Island</category>
// <description

class RssNewsSource extends NewsSource {
    constructor(urlString, requireFetchArticles){
        super(urlString, requireFetchArticles);
    }    

    saveToConfig() {
        // Exclude non-serializableProp from serialization
        return {
          ...super.saveToConfig(),
        };
    }

    async download(){
        return new Promise((resolve, reject) => {
            parser.parseURL(this.url.href).then(feed => {
                this._saveSourceData(feed, feed.items);                
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
}


module.exports = {
	RssNewsSource,
};