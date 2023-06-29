const mongoose = require('mongoose');

const Article = require('./article'); 

const NamedEntitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  articleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }]
});

const NamedEntity = mongoose.model('NamedEntity', NamedEntitySchema);

module.exports = { NamedEntity };