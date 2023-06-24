const mongoose = require('mongoose');

// const NewsSource = require('./models/NewsSource'); // Assuming you have NewsSource model defined

ArticleSchema = new mongoose.Schema({
  title: String,
  link: { type: String, required: true } ,
  author: String,
  publishedDate: Date,
  lastQueryDate: Date,                      // last time the contents of the article has been loaded
  contentData: String, 
  retryCount: { type: Number, default: 0 }, // number of retries done to get the content
  lastError: String,                        // Error message recieved during fetching contentData
  lastAnalysisDate: Date,                   // last time the contents of the article were analyzed with LLM

  // Reference to NewsSource
  sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NewsSource', // The model to use
      required: true
  },  

  // Other properties here...
});

// TO-DO: ChatGPT how to create a model and migrations
const Article = mongoose.model('Article', ArticleSchema);

module.exports = { Article };