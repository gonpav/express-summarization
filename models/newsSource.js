const mongoose = require('mongoose');

/*
const NumberEnum = Object.freeze({
  ONE: 1,
  TWO: 2,
  THREE: 3
});

class MyClass {
  constructor(type) {
    this.type = type;
  }
}

const myInstance = new MyClass(NumberEnum.ONE);
console.log(myInstance.type); // Output: 1
*/

const NewsSourceType = Object.freeze({
  RssFeed: 1,
  ApiFeed: 2
});


NewsSourceSchema = new mongoose.Schema({
  url: String,
  preloadedContent: Boolean, // If true, then the content is already loaded
  type: Number,
  lastQueryDate: Date,
  // lastQueryHash: String 
  // Other properties here...
});

// TO-DO: ChatGPT how to create a model and migrations
const NewsSource = mongoose.model('NewsSource', NewsSourceSchema);

module.exports = { NewsSource, NewsSourceType };