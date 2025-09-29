const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const auth = require('../middleware/auth');

router.post('/generate', auth, qrController.generateQR);
router.get('/user/:userId', qrController.getUserQR);

module.exports = router;
