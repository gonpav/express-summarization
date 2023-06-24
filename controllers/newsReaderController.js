// controllers/newsReaderController.js

require('dotenv').config();

const db = require('../db.js');
const newsManager = require('../services/newsmanager.js');

newsManager.initializeDB(db.connection);

exports.processSources = function(req, res) {
    // from the array of strings remove empty elements
  const inputUrls = req.body.text.filter((element) => {
      return element.trim() !== '';
  });
  console.log(inputUrls);

  newsManager.processSources(inputUrls);
  res.json({ jobsCount: inputUrls.length, currentJob: 0,  message: `Starting obtaining news from ${inputUrls.length} sources` });
};

exports.processSourcesStatus = function(req, res) {
  const processingStatus = newsManager.processSourcesStatus();
  // console.log(processingStatus);
  res.json(processingStatus);
};

exports.processArticles = function(req, res) {
  const newsSource = newsManager.fetchNextNewsSourceArticles();
  if (!newsSource){
      res.json({ jobsCount: 0, currentJob: 0,  message: `There are bo sources to download articles` });
      return;
  }
  res.json({ jobsCount: 1, currentJob: 0,  message: `Starting obtaining articles content from '${newsSource.name}'` });
};

exports.processArticlesStatus = function(req, res) {

  const processingStatus = newsManager.processArticlesStatus();
  //console.log(processingStatus);
  newsManager.resetFetchingArticlesCurrentNewsSource(); // Reset fetching if finished;
  res.json(processingStatus);
};


