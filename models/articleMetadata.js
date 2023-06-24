const mongoose = require('mongoose');

// const NewsSource = require('./models/NewsSource'); // Assuming you have NewsSource model defined

const MetadataSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  queryDate: { type: Date, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true }
});

const ArticleMetadataSchema = new mongoose.Schema({
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  metadata: [MetadataSchema]
});

const ArticleMetadata = mongoose.model('ArticleMetadata', ArticleMetadataSchema);

module.exports = { ArticleMetadata };