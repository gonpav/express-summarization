require('dotenv').config();
const mongoose = require('mongoose');

// Connect mongoose and MongoDB
mongoose.connect(process.env.MONGODB_ATLAS_CS, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() { console.log("Connected to MongoDB Atlas"); }); 

const db = new class{
    constructor() {
        this.connection = null;
    }
}
db.connection = mongoose.connection;

module.exports = db;


