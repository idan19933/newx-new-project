// Simple auth middleware without Firebase Admin
export async function verifyToken(req, res, next) {
    try {
        // Get user ID from request body or headers
        const userId = req.body.userId ||
            req.headers['x-user-id'] ||
            req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        // Add user info to request
        req.user = {
            uid: userId
        };

        next();

    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

export default { verifyToken };