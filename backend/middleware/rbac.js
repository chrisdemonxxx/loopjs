// backend/middleware/rbac.js
const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated or role not found.' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            // user's role is not authorized
            return res.status(403).json({ message: 'Forbidden: You do not have the necessary permissions to access this resource.' });
        }

        // authentication and authorization successful
        next();
    };
};

module.exports = authorize;
