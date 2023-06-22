// routes/newsSourceRoutes.js

const express = require('express');
const router = express.Router();
const newsSourceController = require('../controllers/newsSourceController');

router.get('/', newsSourceController.getAllNewsSources);
router.get('/:index', newsSourceController.getNewsSourceByIndex);

module.exports = router;
