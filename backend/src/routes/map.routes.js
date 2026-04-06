const express = require('express');
const router = express.Router();
const { getMapData } = require('../controllers/map.controller');

// Public - anyone can see the map
router.get('/data', getMapData);

module.exports = router;
