const express = require('express');
const infoController = require('../controllers/info.controller');

const router = express.Router();

// This was changed from .post() to .get()
router.get('/get-user-list', infoController.getUserListAction);

router.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Info APIs",
    });
});
module.exports = router;