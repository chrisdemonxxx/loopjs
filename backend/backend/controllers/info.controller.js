const Client = require('../models/Client');
const catchAsync = require('../utils/catchAsync');

/**
 * Fetches the list of all clients (agents) from the database.
 */
const getUserListAction = catchAsync(async (req, res, next) => {
    const clients = await Client.find({});
    res.status(200).json({
        status: 'success',
        data: clients,
    });
});

const getUserAction = catchAsync(async (req, res, next) => {
    const client = await Client.findOne({ uuid: req.params.uuid });
    if (!client) {
        return next(new AppError('No client found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: client,
    });
});

// Export the function so it can be used by info.route.js
module.exports = {
    getUserListAction,
    getUserAction,
};
