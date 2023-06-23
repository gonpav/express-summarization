const mongoose = require('mongoose');

const NewsSourceType = Object.freeze({
  RssFeed: 1,
  ApiFeed: 2
});

NewsSourceSchema = new mongoose.Schema({
  url: { type: String, required: true },
  preloadedContent: Boolean, // If true, then the content is already loaded
  type: Number,
  lastQueryDate: Date,
  // lastQueryHash: String 
  // Other properties here...
});

// TO-DO: ChatGPT how to create a model and migrations
const NewsSource = mongoose.model('NewsSource', NewsSourceSchema);

module.exports = { NewsSource, NewsSourceType };