require('dotenv').config();

const { Article } = require('../models/article.js');
const { ArticleMetadata } = require('../models/articleMetadata.js');
const { NamedEntity } = require('../models/namedEntity.js')
const { getCompletion, getChatCompletion } = require ('./openaiapi-engine.js')

class ArticleNlpProcessor {
    constructor(){
    } 

    static async analyzeArticle (articleId, prompt, max_tokens) {
        
        ArticleNlpProcessor._validatePrompt(prompt);
        return new Promise(async (resolve, reject) => {
            try {
                let article = await Article.findById(articleId);
                const text = prompt.replace(/{article}/g, article.contentData);
                
                // Get OpenAI completion
                const response = await getCompletion(text, max_tokens);
        
                // Check that output is correct JSON object
                ArticleNlpProcessor._validateLLMResponseData(response.data);

                // 1. Save Article result in the database and return
                article = await Article.findOneAndUpdate( 
                    { _id: article._id, sourceId: article.sourceId }, 
                    { $set: { lastAnalysisDate: new Date() } }, 
                    { upsert: false, new: true }
                    );
        
                // 2. Get or Create new ArticleMetadata object
                const amDB = await ArticleMetadata.findOne({ articleId: article._id }); 
                let articleMetadata = amDB ? amDB : { articleId: article._id };
                // Create new Metadata for article
                articleMetadata = ArticleNlpProcessor._addArticleMetadata (articleMetadata, response.data, prompt);
                // Save articleMetadata in the DB
                await ArticleMetadata.findOneAndUpdate( 
                    { articleId: article._id }, 
                    { $set: articleMetadata }, 
                    { upsert: true, new: false }
                    );
                    
                // 3. Save NamedEntities
                if (await ArticleNlpProcessor._addNamedEntities(articleId, response.data) == false) {
                    console.log('Warning: failed to save NamedEntities');   
                }

                // 4. Return result
                resolve( { data: articleMetadata.metadata, article: article });    
            }
            catch (err) {
                reject( err );
            }  
        });        
    };


    static async saveArticleLatestNamedEntities(articleId) {
        return new Promise(async (resolve, reject) => {
            // let article = await Article.findById(articleId);
            const articleMetadata = await ArticleMetadata.findOne({ articleId: articleId }); 
            if (articleMetadata && articleMetadata.metadata){
                // Get the latest metadata and show it in the prompt (if showPrompt) and jsonOutput area
                let mostRecentMetadata = articleMetadata.metadata.reduce((mostRecent, current) => {
                    return (mostRecent.queryDate > current.queryDate) ? mostRecent : current;
                });
                await ArticleNlpProcessor._addNamedEntities(articleId, mostRecentMetadata.result);
            }
            resolve();
        });   
    }
    
    static _validatePrompt(prompt) {
        if (!prompt.includes('entities')) throw new Error ('Error: no "entities" field in the required JSON output of the prompt');
    }

    static _validateLLMResponseData(responseData) {
        let jsonObj = null; 
        try {
            jsonObj = JSON.parse(responseData.choices[0].text);            
        } catch (error) {
            let partialContent = responseData;
            try {
                partialContent = JSON.stringify(responseData, null, 2)
            } catch (e) {                    
            }            
            throw new Error(`${error.message}\n${partialContent}`);
        }

        if (!jsonObj.entities) {
            let partialContent = responseData;
            try {
                partialContent = JSON.stringify(responseData, null, 2)
            } catch (e) {                    
            }
            throw new Error(`No "entities" field found in the JSON output of the response:\n${partialContent}`);
        }
        return jsonObj;
    }

    static async _addNamedEntities(articleId, articleMetadata) {
        return new Promise(async (resolve, reject) => {
            try {
                
                // 
                const metadataEntities = ArticleNlpProcessor._getMetadataEntities (articleMetadata, articleId);   
                /* metadataEntities.forEach(element => {
                    console.log(JSON.stringify(element)); 
                });*/    

                const operations = metadataEntities.map(metadataEntity => ({
                    updateOne: {
                        filter: { name: metadataEntity.name, value: metadataEntity.value },
                        update: { $addToSet: { articleIds: metadataEntity.articleId } },
                        upsert: true
                    }
                }));
                
                const result = await NamedEntity.bulkWrite(operations);
                // console.log(result); 

                resolve( true );    
            }
            catch (err) {
                console.error(err); 
                resolve( false );
            }  
        });  
    }

    static _addArticleMetadata(articleMetadata, response, prompt) {
        if (!articleMetadata.metadata) {
            articleMetadata.metadata = [];
        }
        const metadata = {
            prompt: prompt,
            queryDate: new Date(),
            result: response        
        };
        articleMetadata.metadata.push(metadata);
        return articleMetadata;
    }

    static _getMetadataEntities(metadata, articleId) {
        let result = [];
        try {
            const jsonObj = ArticleNlpProcessor._validateLLMResponseData(metadata);
            for (let key in jsonObj.entities) {
                jsonObj.entities[key].forEach(val => {
                    if (!result.find(x => x.name === key && x.value === val)){
                        result.push({
                            name: key,
                            value: val,
                            articleId: articleId
                            /*, 
                            articleIds: [articleId]*/
                        });
                    }               
                });
            }
        } catch (error) {
            console.error(error);
        }
        return result;
    }    
}

module.exports = {
	ArticleNlpProcessor: ArticleNlpProcessor,
};
