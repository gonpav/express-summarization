// controllers/newsReaderController.js

require('dotenv').config();

const db = require('../db.js');
const newsReader = require('../services/newsreader.js');

newsReader.initializeDB(db.connection);

exports.processSources = function(req, res) {
    // from the array of strings remove empty elements
  const inputUrls = req.body.text.filter((element) => {
      return element.trim() !== '';
  });
  console.log(inputUrls);

  newsReader.processSources(inputUrls);
  res.json({ jobsCount: inputUrls.length, currentJob: 0,  message: `Starting obtaining news from ${inputUrls.length} sources` });
};

exports.processSourcesStatus = function(req, res) {
  const processingStatus = newsReader.processSourcesStatus();
  // console.log(processingStatus);
  res.json(processingStatus);
};

exports.processArticles = function(req, res) {
  const newsSource = newsReader.fetchNextNewsSourceArticles();
  if (!newsSource){
      res.json({ jobsCount: 0, currentJob: 0,  message: `There are bo sources to download articles` });
      return;
  }
  res.json({ jobsCount: 1, currentJob: 0,  message: `Starting obtaining articles content from '${newsSource.name}'` });
};

exports.processArticlesStatus = function(req, res) {

  const processingStatus = newsReader.processArticlesStatus();
  //console.log(processingStatus);
  newsReader.resetFetchingArticlesCurrentNewsSource(); // Reset fetching if finished;
  res.json(processingStatus);
};


