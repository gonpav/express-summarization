// controllers/ArticleController.js

require('dotenv').config();
const { Article } = require('../models/article.js');
const { getCompletion } = require ('../services/openaiapi-engine.js')

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

exports.analyzeArticleById = async function(req, res) {
    const articleId = req.params.id;
    const prompt = req.body.text;
    // console.log(articleId);
    // console.log(prompt);   
    try {
        const article = await Article.findById(articleId);
        // console.log(article);
        const text = prompt.replace(/{article}/g, article.contentData);
        const response = await getCompletion(text);
        // console.log(response.data.choices[0].text.trim());
        res.json( response.data );
    //    res.json({ message: `Start analyzing with ChatGPT 3.5 the contents of the article with id ${articleId}. Please wait...` });
    }
    catch (err) {
        res.json( err.message );
    }
};

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
