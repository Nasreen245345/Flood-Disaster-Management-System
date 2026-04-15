const express = require('express');
const router = express.Router();
const { getPrediction } = require('../controllers/prediction.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:orgId', protect, getPrediction);

module.exports = router;
