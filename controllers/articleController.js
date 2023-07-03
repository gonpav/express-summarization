// controllers/ArticleController.js

require('dotenv').config();

const { Article } = require('../models/article.js');
const { ArticleMetadata } = require('../models/articleMetadata.js');
const { ArticleNlpProcessor } = require('../services/article-nlp-processor.js');


exports.getArticleById = function(req, res) {
    const articleId = req.params.id;
    Article
    .findOne({ _id: articleId })
    .then(item => {
        res.json(toArticleDTO(item) );
    });        
};

exports.getArticlesBySourceId = function(req, res) {
    const sourceId = req.params.id;
    Article
    .find({ sourceId: sourceId })
    .sort({ lastAnalysisDate: -1 })
    .then(items => {
        const articles = items.map((x) => { return toArticleDTO(x) }); 
        res.json(articles);
    });        
};

exports.analyzeArticleById = async function(req, res) {
    const articleId = req.params.id;
    const max_tokens = req.body.max_tokens;
    const temperature = req.body.temperature;
    const prompt = req.body.text;

    try {
        // This is the right code to analyze the article.
        const result = await ArticleNlpProcessor.analyzeArticle(articleId, prompt, max_tokens, temperature);
        res.json( { data: result.data.map(metadata => toMetadataDTO(metadata)), article: toArticleDTO (result.article) });    
    }
    catch (err) {
        res.json( { error: err.message } );
    }
};
 
exports.getArticleNamedEntities = async function(req, res) {
    const articleId = req.params.id;
    const max_tokens = req.body.max_tokens;
    const prompt = req.body.text;

    try {
        // Temporary code to save all named entities of the latest metadata of the article
        await ArticleNlpProcessor.saveArticleLatestNamedEntities(articleId);
        res.json( { error: "All good" });    
    }
    catch (err) {
        res.json( { error: err.message } );
    }
};

exports.getArticleMetadataById = async function(req, res) {
    const articleId = req.params.id;
    try {
        // Get ArticleMetadata object
        const articleMetadata = await ArticleMetadata.findOne({ articleId: articleId });
        articleMetadata ? res.json({ data: articleMetadata.metadata.map(metadata => toMetadataDTO(metadata)) }) : res.json({ data: "" });
    }
    catch (err) {
        res.json( { data: err.message } );
    }
};  

function toArticleDTO(x) {
    return {
        id: x._id,
        title: x.title,
        link: x.link,
        author: x.author,
        pubDate: x.publishedDate,
        contentData: x.contentData, 
        lastError: x.lastError,
        lastAnalysisDate: x.lastAnalysisDate
    };
}

function toMetadataDTO(x) {
    let data = "";
    if (x.result && x.result.choices) {
        // Now we should check if this is an output from "createCompletion" or "createChatCompletion"
        if (x.result.choices[0].text) {
            data = x.result.choices[0].text;
        }
        else if (x.result.choices[0].message) {
            data = x.result.choices[0].message.content;
        }
    }

    return {
        id: x._id,
        prompt: x.prompt,
        queryDate: x.queryDate,
        response: x.result,
        data: data
    };
}

