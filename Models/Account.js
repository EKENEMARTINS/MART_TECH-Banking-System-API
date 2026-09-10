const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },

        accountNumber: {
            type: String,
            required: true,
            unique: true
        },

        accountName: {
            type: String,
            required: true
        },

        bankCode: {
            type: String,
            required: true
        },

        bankName: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'Account',
    accountSchema
);