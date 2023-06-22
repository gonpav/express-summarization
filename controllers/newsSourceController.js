// controllers/newsSourceController.js

// const NewsSource = require('../models/NewsSource');
require('dotenv').config();
const newsManager = require('../services/newsmanager.js');

exports.getAllNewsSources = function(req, res) {
    res.json({data: newsManager.sources});
};

exports.getNewsSourceByIndex = function(req, res) {

    const index = req.params.index;
    res.json({data: newsManager.sources[index]});
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