// controllers/newsSourceController.js

require('dotenv').config();
const { URL } = require('url');
const { NewsSource } = require('../models/newsSource.js');

exports.getAllNewsSources = function(req, res) {

    NewsSource
    .find()
    .sort({lastQueryDate: -1})
    .then(items => {
        const sources = items.map((x) => {
            return {
                url:  x.url, 
                name: new URL(x.url).hostname, 
                id: x._id
            };
        }); 
        res.json(sources);
    }); 
};
exports.getNewsSourceByIndex = function(req, res) {

    const index = req.params.index;
    res.json({/* data: newsManager.sources[index] */});
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