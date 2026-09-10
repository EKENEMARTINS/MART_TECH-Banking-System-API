const Account = require('../Models/Account');
const nibss = require('../Services/NibssService');


// ==========================================
// CREATE ACCOUNT
// ==========================================

exports.createAccount =
    async (req, res) => {

        try {
            const user = req.user;

            if (
                !user.isVerified ||
                !user.kycType ||
                !user.kycID
            ) {
                return res.status(403).json({
                    message:
                        'Complete BVN or NIN verification before creating an account'
                });
            }

            // Maximum one account/customer
            const existingAccount =
                await Account.findOne({
                    customer:
                        user._id
                });

            if (existingAccount) {
                return res.status(409).json({
                    message:
                        'Customer already has a bank account'
                });
            }

            const response =
                await nibss.createAccount({
                    kycType:
                        user.kycType,

                    kycID:
                        user.kycID,

                    dob:
                        user.dob
                });

            // Live API nests account here.
            const nibssAccount =
                response.data?.account;

            if (
                !nibssAccount
                    ?.accountNumber
            ) {
                return res.status(502).json({
                    message:
                        'NIBSS did not return an account number'
                });
            }

            const account =
                await Account.create({
                    customer:
                        user._id,

                    accountNumber:
                        nibssAccount
                            .accountNumber,

                    accountName:
                        nibssAccount
                            .accountName ||
                        `${user.firstName} ${user.lastName}`,

                    bankCode:
                        nibssAccount
                            .bankCode ||
                        process.env.BANK_CODE,

                    bankName:
                        nibssAccount
                            .bankName ||
                        process.env.BANK_NAME
                });

            return res.status(201).json({
                message:
                    'Bank account created successfully',

                account: {
                    accountNumber:
                        account.accountNumber,

                    accountName:
                        account.accountName,

                    bankCode:
                        account.bankCode,

                    bankName:
                        account.bankName,

                    openingBalance:
                        nibssAccount.balance
                }
            });

        } catch (error) {
            console.error(
                'Account creation error:',
                error.message
            );

            return res
                .status(error.status || 500)
                .json({
                    message:
                        'Account creation failed',

                    error:
                        error.message
                });
        }
    };


// ==========================================
// MY ACCOUNT
// ==========================================

exports.getMyAccount =
    async (req, res) => {

        try {
            const account =
                await Account.findOne({
                    customer:
                        req.user._id
                });

            if (!account) {
                return res.status(404).json({
                    message:
                        'Bank account not found'
                });
            }

            return res.status(200).json({
                message:
                    'Account retrieved successfully',

                account
            });

        } catch (error) {
            return res.status(500).json({
                message:
                    'Failed to retrieve account'
            });
        }
    };


// ==========================================
// BALANCE
// ==========================================

exports.getBalance =
    async (req, res) => {

        try {
            const account =
                await Account.findOne({
                    customer:
                        req.user._id
                });

            if (!account) {
                return res.status(404).json({
                    message:
                        'Bank account not found'
                });
            }

            const response =
                await nibss.getBalance(
                    account.accountNumber
                );

            const result =
                response.data?.data ||
                response.data?.account ||
                response.data;

            if (
                result?.balance ===
                undefined
            ) {
                return res.status(502).json({
                    message:
                        'NIBSS did not return account balance'
                });
            }

            return res.status(200).json({
                message:
                    'Balance retrieved successfully',

                accountNumber:
                    account.accountNumber,

                accountName:
                    account.accountName,

                balance:
                    result.balance
            });

        } catch (error) {
            console.error(
                'Balance error:',
                error.message
            );

            return res
                .status(error.status || 500)
                .json({
                    message:
                        'Failed to retrieve balance',

                    error:
                        error.message
                });
        }
    };


// ==========================================
// NAME ENQUIRY
// ==========================================

exports.nameEnquiry =
    async (req, res) => {

        try {
            const {
                accountNumber
            } = req.params;

            if (
                !/^\d{10}$/.test(
                    accountNumber || ''
                )
            ) {
                return res.status(400).json({
                    message:
                        'Account number must contain exactly 10 digits'
                });
            }

            const response =
                await nibss.nameEnquiry(
                    accountNumber
                );

            const result =
                response.data?.data ||
                response.data?.account ||
                response.data;

            return res.status(200).json({
                message:
                    'Name enquiry successful',

                account:
                    result
            });

        } catch (error) {
            console.error(
                'Name enquiry error:',
                error.message
            );

            return res
                .status(error.status || 500)
                .json({
                    message: 'Name enquiry failed',

                    error: error.message
                });
        }
    };