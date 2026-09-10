const User = require('../Models/User');

const bcrypt =
    require('bcryptjs');

const jwt =
    require('jsonwebtoken');


const generateToken = (userId) => {
    return jwt.sign(
        {
            id: userId
        },

        process.env.JWT_SECRET,

        {
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                '1d'
        }
    );
};


// ==========================================
// REGISTER
// ==========================================

exports.register = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            dob
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !phone ||
            !dob
        ) {
            return res.status(400).json({
                message:
                    'All fields are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message:
                    'Password must contain at least 8 characters'
            });
        }

        const existingUser =
            await User.findOne({
                email:
                    email
                        .trim()
                        .toLowerCase()
            });

        if (existingUser) {
            return res.status(409).json({
                message:
                    'Email already registered'
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );

        const user =
            await User.create({
                firstName,
                lastName,

                email:
                    email
                        .trim()
                        .toLowerCase(),

                password:
                    hashedPassword,

                phone,
                dob
            });

        const token =
            generateToken(user._id);

        return res.status(201).json({
            message:
                'Registration successful',

            token,

            user: {
                id: user._id,
                firstName:
                    user.firstName,
                lastName:
                    user.lastName,
                email:
                    user.email,
                isVerified:
                    user.isVerified
            }
        });

    } catch (error) {
        console.error(
            'Registration error:',
            error.message
        );

        return res.status(500).json({
            message:
                'Registration failed'
        });
    }
};


// ==========================================
// LOGIN
// ==========================================

exports.login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message:
                    'Email and password are required'
            });
        }

        const user =
            await User.findOne({
                email:
                    email
                        .trim()
                        .toLowerCase()
            }).select('+password');

        if (!user) {
            return res.status(401).json({
                message:
                    'Invalid email or password'
            });
        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatches) {
            return res.status(401).json({
                message:
                    'Invalid email or password'
            });
        }

        const token =
            generateToken(user._id);

        return res.status(200).json({
            message:
                'Login successful',

            token,

            user: {
                id: user._id,
                firstName:
                    user.firstName,
                lastName:
                    user.lastName,
                email:
                    user.email,
                isVerified:
                    user.isVerified,
                kycType:
                    user.kycType
            }
        });

    } catch (error) {
        console.error(
            'Login error:',
            error.message
        );

        return res.status(500).json({
            message: 'Login failed'
        });
    }
};
