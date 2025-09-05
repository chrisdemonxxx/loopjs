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

// Export the function so it can be used by info.route.js
module.exports = {
    getUserListAction,
};
