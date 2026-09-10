const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },

        lastName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        phone: {
            type: String,
            required: true
        },

        dob: {
            type: String,
            required: true
        },

        kycType: {
            type: String,
            enum: ['bvn', 'nin', null],
            default: null
        },

        kycID: {
            type: String,
            default: null,
            select: false
        },

        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Extra protection against password exposure
userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        delete ret.kycID;

        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);