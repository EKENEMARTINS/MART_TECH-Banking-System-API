const jwt = require('jsonwebtoken');
const User = require('../Models/User');

exports.protect = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith('Bearer ')
        ) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        const token = authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Authentication token is required'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // kycID is hidden by default but required internally
        // for NIBSS account operations.
        const user = await User.findById(
            decoded.id
        ).select('+kycID');

        if (!user) {
            return res.status(401).json({
                message: 'User no longer exists'
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};