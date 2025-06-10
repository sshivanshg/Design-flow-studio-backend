const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Insufficient permissions'
            });
        }

        next();
    };
};

// Role-based route access
const routeAccess = {
    admin: ['/settings', '/billing', '/dashboard', '/proposals', '/moodboard', '/crm', '/clients'],
    designer: ['/dashboard', '/proposals', '/moodboard'],
    sales: ['/dashboard', '/crm', '/clients']
};

const checkRouteAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const userRole = req.user.role;
    const requestedPath = req.path;

    if (!routeAccess[userRole] || !routeAccess[userRole].some(path => requestedPath.startsWith(path))) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: Insufficient permissions for this route'
        });
    }

    next();
};

module.exports = {
    checkRole,
    checkRouteAccess
}; 