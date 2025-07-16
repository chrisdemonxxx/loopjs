const express = require('express');
const infoController = require('../controllers/info.controller');

const router = express.Router();

router.post('/get-user-list', infoController.getUserListAction);

router.get('/', (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Info APIs",
    });
});
module.exports = router;