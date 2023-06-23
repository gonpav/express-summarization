require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Connect mongoose and MongoDB
mongoose.connect(process.env.MONGODB_ATLAS_CS, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() { console.log("Connected to MongoDB Atlas"); }); 

// Import routes and data
const newsManager = require('./services/newsmanager.js');
const newsSourceRoutes = require('./routes/newsSourceRoutes');

newsManager.initializeDB(mongoose.connection);

app.use('/api/news-sources', newsSourceRoutes);

app.use('/news', async (req, res) => {
    res.json({hasData:  (newsManager.sources && newsManager.sources.length > 0)});
});

app.use('/processSourcesStatus', async (req, res) => {
    const processingStatus = newsManager.processSourcesStatus();
    // console.log(processingStatus);
    res.json(processingStatus);
});

app.use('/processSources', async (req, res) => {
    // from the array of strings remove empty elements
    const inputUrls = req.body.text.filter((element) => {
        return element.trim() !== '';
    });
    console.log(inputUrls);

    newsManager.processSources(inputUrls);
    res.json({ jobsCount: inputUrls.length, currentJob: 0,  message: `Starting obtaining news from ${inputUrls.length} sources` });
});

app.use('/processArticlesStatus', async (req, res) => {
    const processingStatus = newsManager.processArticlesStatus();
    //console.log(processingStatus);
    newsManager.resetFetchingArticlesCurrentNewsSource(); // Reset fetching if finished;
    res.json(processingStatus);
});

app.use('/processArticles', async (req, res) => {
    const newsSource = newsManager.fetchNextNewsSourceArticles();
    if (!newsSource){
        res.json({ jobsCount: 0, currentJob: 0,  message: `There are bo sources to download articles` });
        return;
    }
    res.json({ jobsCount: 1, currentJob: 0,  message: `Starting obtaining articles content from '${newsSource.name}'` });
});

app.use('/getArticlesData', async (req, res) => {
    const articles = newsManager.sources.flatMap(source =>
        source.articles.map(obj => {
            const newObj = {};
            Object.keys(obj).forEach(key => {
                newObj[key] = obj[key];
            });
            return newObj;
        })
    );

    res.json({ articles: articles });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server started on port ' + port);
});

