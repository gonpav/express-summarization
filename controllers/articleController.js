// controllers/ArticleController.js

require('dotenv').config();
const { Article } = require('../models/article.js');
const { ArticleMetadata } = require('../models/articleMetadata.js');
const { getCompletion } = require ('../services/openaiapi-engine.js')

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
    const prompt = req.body.text;

    // console.log(articleId);
    // console.log(prompt);   
    try {
        let article = await Article.findById(articleId);
        const prevAnalysisDate = article.lastAnalysisDate; 
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
        let articleMetadata = { articleId: article._id };
        if (prevAnalysisDate) { 
            articleMetadata = await ArticleMetadata.findOne({ articleId: article._id }); 
        }
        // Create new Metadata for article
        articleMetadata = addArticleMetadata (articleMetadata, response.data, prompt);
        // Save articleMetadata in the DB
        await ArticleMetadata.findOneAndUpdate( 
            { articleId: article._id }, 
            { $set: articleMetadata }, 
            { upsert: true, new: false }
            );

        // console.log(response.data.choices[0].text.trim());
        res.json( { data: response.data, article: toArticleDTO (article) });
    //    res.json({ message: `Start analyzing with ChatGPT 3.5 the contents of the article with id ${articleId}. Please wait...` });
    }
    catch (err) {
        res.json( { data: err.message } );
    }
};

 
exports.getArticleMetadataById = async function(req, res) {
    const articleId = req.params.id;
    try {
        // Get ArticleMetadata object
        const articleMetadata = await ArticleMetadata.findOne({ articleId: articleId });
        if (articleMetadata) {             
            let mostRecentMetadata = articleMetadata.metadata.reduce((mostRecent, current) => {
                return (mostRecent.queryDate > current.queryDate) ? mostRecent : current;
            });
            res.json( { data: mostRecentMetadata.result, prompt: mostRecentMetadata.prompt });
        }
        else {
            res.json( { data: "" } );
        }
    }
    catch (err) {
        res.json( { data: err.message } );
    }
};

function addArticleMetadata(articleMetadata, response, prompt) {
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

/*
exports.analyzeArticleByIdAsync = function(req, res) {
    const articleId = req.params.id;
    const prompt = req.body.text;
    console.log(articleId);
    console.log(prompt);   
    Article.findById(articleId)
    .then(async (article) => {
        console.log(article);
        const text = prompt.replace(/{article}/g, article.contentData);
        getCompletion(text)
       .then(response => {
            // const summary = response.data.choices[0].text.trim();
            // article.summary = summary;
            console.log(response.data.choices[0].text.trim());
            res.json({ message: response });
       })
    }) 
    .catch(err => {
        res.status(500).send(err);
    });
    res.json({ message: `Start analyzing with ChatGPT 3.5 the contents of the article with id ${articleId}. Please wait...` });
    return;
};
*/
