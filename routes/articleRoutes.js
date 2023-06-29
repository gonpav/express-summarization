// routes/newsSourceRoutes.js

const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticlesBySourceId);
router.post('/analyze/:id', articleController.analyzeArticleById);
router.get('/namedentities/:id', articleController.getArticleNamedEntities);
router.get('/metadata/:id', articleController.getArticleMetadataById);

module.exports = router;
