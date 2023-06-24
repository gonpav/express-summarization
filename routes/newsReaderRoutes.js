// routes/newsSourceRoutes.js

const express = require('express');
const router = express.Router();
const newsReaderController = require('../controllers/newsReaderController.js');

router.post('/processSources', newsReaderController.processSources);
router.get('/processSourcesStatus', newsReaderController.processSourcesStatus);
router.get('/processArticles', newsReaderController.processArticles);
router.get('/processArticlesStatus', newsReaderController.processArticlesStatus);

module.exports = router;
