// controllers/namedEntityController.js

require('dotenv').config();

const { NamedEntity } = require('../models/namedEntity.js');

// Get ALL item sorted by articleIds.count descending
exports.getAllNamedEntities = function(req, res) {
    NamedEntity.aggregate([
        { $addFields: { articlesCount: { $size: "$articleIds" } } },
        { $sort: { articlesCount: -1 } }
    ])
    .then(items => {
        res.json(items);
    })
    .catch(error => {
        console.error(error);
        res.status(400).send(error);
    })         
};

// Get top 20 item sorted by articleIds.count ascending
exports.getTop20SortedAsc = function (req, res) {
    NamedEntity.aggregate([
        { $addFields: { articlesCount: { $size: "$articleIds" } } },
        { $sort: { articlesCount: 1 } },
        { $limit: 20 }
    ])
    .then(items => {
        res.json(items);
    })
    .catch(error => {
        console.error(error);
        res.status(400).send(error);
    })  
};

// Get NEXT top 20 item sorted by articleIds.count ascending
exports.getNextTop20SortedAsc = function (req, res) {
    NamedEntity.aggregate([
        { $addFields: { articlesCount: { $size: "$articleIds" } } },
        { $sort: { articlesCount: 1 } },
        { $skip: 20 },
        { $limit: 20 }
    ])
    .then(items => {
        res.json(items);
    })
    .catch(error => {
        console.error(error);
        res.status(400).send(error);
    })  
};
