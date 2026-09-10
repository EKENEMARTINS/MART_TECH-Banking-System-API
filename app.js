const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const connectDB = require('./Config/db');
const app = express();


connectDB();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./Routes/AuthRoute');
const onboardingRoutes = require('./Routes/OnboardingRoute');
const accountRoutes = require('./Routes/AccountRoute');
const transactionRoutes = require('./Routes/TransactionRoute');

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'MART_TECH Banking System API is running'
    });
});

app.use('/auth', authRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/account', accountRoutes);
app.use('/transaction', transactionRoutes);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
    return res.status(404).json({
        message: 'API endpoint not found'
    });
});


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
    (err, req, res, next) => {

        console.error(
            'Unhandled error:',
            err.message
        );

        return res
            .status(err.status || 500)
            .json({
                message: err.message || 'Internal server error'
            });
    }
);

app.listen(process.env.PORT, () => {
    console.log("Server is running on port " + process.env.PORT);
});