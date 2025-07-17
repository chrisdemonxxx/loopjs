const Client = require('../models/Client');

/**
 * Fetches the list of all clients (agents) from the database.
 */
const getUserListAction = async (req, res) => {
    try {
        const clients = await Client.find({});
        res.status(200).json({
            status: 'success',
            data: clients,
        });
    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching user list.',
        });
    }
};

// Export the function so it can be used by info.route.js
module.exports = {
    getUserListAction,
};
