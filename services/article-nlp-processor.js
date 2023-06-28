require('dotenv').config();

const { Article } = require('../models/article.js');
const { ArticleMetadata } = require('../models/articleMetadata.js');
const { getCompletion } = require ('./openaiapi-engine.js')

class ArticleNlpProcessor {
    constructor(){
    } 

    static async analyzeArticle (articleId, prompt, max_tokens) {
        return new Promise(async (resolve, reject) => {
            try {
                let article = await Article.findById(articleId);
                const text = prompt.replace(/{article}/g, article.contentData);
                
                // Get OpenAI completion
                const response = await getCompletion(text, max_tokens);
        
                // Save Article result in the database and return
                article = await Article.findOneAndUpdate( 
                    { _id: article._id, sourceId: article.sourceId }, 
                    { $set: { lastAnalysisDate: new Date() } }, 
                    { upsert: false, new: true }
                    );
        
                // Get or Create new ArticleMetadata object
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
                resolve( { data: articleMetadata.metadata, article: article });    
            }
            catch (err) {
                reject( err );
            }  
        });        
    };
    

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
}

module.exports = {
	ArticleNlpProcessor: ArticleNlpProcessor,
};
