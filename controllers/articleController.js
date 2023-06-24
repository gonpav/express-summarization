// controllers/ArticleController.js

require('dotenv').config();
const { Article } = require('../models/article.js');

exports.getArticlesBySourceId = function(req, res) {
    const sourceId = req.params.id;
    Article
    .find({ sourceId: sourceId })
    .sort({ lastQueryDate: -1 })
    .then(items => {
        const articles = items.map((x) => {
            return {
                id: x._id,
                title: x.title,
                link: x.link,
                author: x.author,
                pubDate: x.publishedDate,
                contentData: x.contentData, 
                lastError: x.lastError
            };
        }); 
        res.json(articles);
    });        
};

exports.analyzeArticleById = function(req, res) {
    const articleId = req.params.id;
    const prompt = req.body.text;
    console.log(articleId);
    console.log(prompt);      
    res.json({ message: `Start analyzing with ChatGPT 3.5 the contents of the article with id ${articleId}. Please wait...` });
};
