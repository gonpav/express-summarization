// routes/newsSourceRoutes.js

const express = require('express');
const router = express.Router();
const namedEntityController = require('../controllers/namedEntityController');

router.get('/', namedEntityController.getAllNamedEntities);

module.exports = router;
