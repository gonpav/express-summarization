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

NewsSourceModelSchema = new mongoose.Schema({
  url: String,
  preloadedContent: Boolean, // If true, then the content is already loaded
  type: Number,
  // Other properties here...
});

// TO-DO: ChatGPT how to create a model and migrations
// const NewsSourceModel = mongoose.model('NewsSourceModel', NewsSourceModelSchema);

// module.exports = NewsSourceModel;