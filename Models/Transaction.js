const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        transactionId: {
            type: String,
            required: true
        },

        from: {
            type: String,
            required: true
        },

        to: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        // DEBIT = money sent
        // CREDIT = money received
        direction: {
            type: String,
            enum: ['DEBIT', 'CREDIT'],
            required: true
        },

        recipientName: {
            type: String
        },

        recipientBank: {
            type: String
        },

        transferType: {
            type: String,
            enum: [
                'INTRA_BANK',
                'INTER_BANK'
            ],
            required: true
        },

        status: {
            type: String,
            enum: [
                'PENDING',
                'SUCCESS',
                'FAILED'
            ],
            default: 'PENDING'
        }
    },
    {
        timestamps: true
    }
);


// Each customer can only have one local record
// for a particular NIBSS transaction.
transactionSchema.index(
    {
        customer: 1,
        transactionId: 1
    },
    {
        unique: true
    }
);


module.exports = mongoose.model(
    'Transaction',
    transactionSchema
);