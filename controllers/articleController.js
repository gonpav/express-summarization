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
