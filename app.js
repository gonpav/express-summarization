require('dotenv').config();
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

app.use('/newssources', newsSourceRoutes);
app.use('/articles', articleRoutes);
app.use('/newsreader', newsReaderRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server started on port ' + port);
});

