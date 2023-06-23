// controllers/ArticleController.js

require('dotenv').config();
const { Article } = require('../models/article.js');

// const newsManager = require('../services/newsmanager.js');

exports.getArticlesBySourceId = function(req, res) {
    res.json({  });
};

/*
const NewsSource = require('../models/NewsSource');

exports.getAllNewsSources = function(req, res) {
  NewsSource.find({}, function(err, newsSources) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(newsSources);
    }
  });
};

exports.getNewsSourceById = function(req, res) {
  const id = req.params.id;
  NewsSource.findById(id, function(err, newsSource) {
    if (err) {
      res.status(500).send(err);
    } else if (newsSource) {
      res.json(newsSource);
    } else {
      res.status(404).send('No news source found with that ID');
    }
  });
};
*/