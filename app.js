require('dotenv').config();


let keep_alive;
if (process.env.KEEP_ALIVE === 'true') {
    // Require keep_alive.js to continue working in Replit env:
    // https://docs.replit.com/tutorials/nodejs/build-basic-discord-bot-nodejs#keeping-our-bot-alive
    keep_alive = require('./keep_alive.js');
}


const express = require('express');
const path = require('path');

const bodyParser = require('body-parser');
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// initialize db connection
const db = require('./db.js');

// Import routes and data
const newsSourceRoutes = require('./routes/newsSourceRoutes');
const articleRoutes = require('./routes/articleRoutes.js');
const newsReaderRoutes = require('./routes/newsReaderRoutes.js');
const namedEntityRoutes = require('./routes/namedEntityRoutes.js');

app.use('/newssources', newsSourceRoutes);
app.use('/articles', articleRoutes);
app.use('/namedentities',namedEntityRoutes);
app.use('/newsreader', newsReaderRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server started on port ' + port);
});

