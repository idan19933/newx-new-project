import admin from '../config/firebase-admin.js';

export async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Add user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email
        };

        next();

    } catch (error) {
        console.error('Auth error:', error);
        return res.status(403).json({
            success: false,
            error: 'Invalid token'
        });
    }
}

export default { verifyToken };