const AuditLog = require('../models/AuditLog');

const audit = (actionType, getDetails = (req) => ({})) => {
    return async (req, res, next) => {
        try {
            if (req.user && req.user._id) { // Ensure user is authenticated
                const details = getDetails(req);
                const logEntry = new AuditLog({
                    user: req.user._id,
                    action: actionType,
                    details: {
                        ...details,
                        method: req.method,
                        path: req.path,
                        ip: req.ip
                    }
                });
                await logEntry.save();
            }
        } catch (error) {
            console.error('Error saving audit log:', error);
            // Do not block the request if audit logging fails
        }
        next();
    };
};

module.exports = audit;
