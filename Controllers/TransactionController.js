const Account = require('../Models/Account');
const Transaction = require('../Models/Transaction');
const nibss = require('../Services/NibssService');


// ==========================================
// TRANSFER
// ==========================================

exports.transfer = async (req, res) => {
    try {
        const {
            to,
            amount
        } = req.body;


        // ==================================
        // VALIDATE INPUT
        // ==================================

        if (
            !to ||
            amount === undefined
        ) {
            return res.status(400).json({
                message:
                    'Recipient account and amount are required'
            });
        }


        if (!/^\d{10}$/.test(to)) {
            return res.status(400).json({
                message:
                    'Recipient account must contain exactly 10 digits'
            });
        }


        const numericAmount =
            Number(amount);


        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {
            return res.status(400).json({
                message:
                    'Transfer amount must be greater than zero'
            });
        }


        // ==================================
        // GET AUTHENTICATED SENDER ACCOUNT
        // ==================================

        const senderAccount =
            await Account.findOne({
                customer:
                    req.user._id
            });


        if (!senderAccount) {
            return res.status(404).json({
                message:
                    'Sender bank account not found'
            });
        }


        // ==================================
        // PREVENT SELF TRANSFER
        // ==================================

        if (
            String(
                senderAccount.accountNumber
            ) ===
            String(to)
        ) {
            return res.status(400).json({
                message:
                    'You cannot transfer money to your own account'
            });
        }


        // ==================================
        // NAME ENQUIRY
        // ==================================

        const enquiryResponse =
            await nibss.nameEnquiry(to);


        const recipient =
            enquiryResponse.data?.data ||
            enquiryResponse.data?.account ||
            enquiryResponse.data;


        const recipientName =
            recipient?.accountName ||
            recipient?.name;


        const recipientBank =
            recipient?.bankName ||
            recipient?.bank;


        const recipientBankCode =
            recipient?.bankCode;


        if (!recipientName) {
            return res.status(400).json({
                message:
                    'Unable to verify recipient account'
            });
        }


        // ==================================
        // CHECK SENDER BALANCE
        // ==================================

        const balanceResponse =
            await nibss.getBalance(
                senderAccount.accountNumber
            );


        const balanceData =
            balanceResponse.data?.data ||
            balanceResponse.data?.account ||
            balanceResponse.data;


        const availableBalance =
            Number(
                balanceData?.balance
            );


        if (
            !Number.isFinite(
                availableBalance
            )
        ) {
            return res.status(502).json({
                message:
                    'Unable to determine available balance'
            });
        }


        if (
            availableBalance <
            numericAmount
        ) {
            return res.status(400).json({
                message:
                    'Insufficient funds',

                availableBalance
            });
        }


        // ==================================
        // PERFORM TRANSFER THROUGH NIBSS
        // ==================================

        const transferResponse =
            await nibss.transfer({
                from:
                    senderAccount.accountNumber,

                to,

                amount:
                    String(numericAmount)
            });


        const transferData =
            transferResponse.data?.data ||
            transferResponse.data?.transaction ||
            transferResponse.data;


        /*
            Live NIBSS response:

            {
                reference: "TX...",
                senderAccount: "...",
                receiverAccount: "...",
                amount: 1000,
                status: "SUCCESS"
            }
        */


        const transactionId =
            transferData?.reference ||
            transferData?.transactionId;


        if (!transactionId) {
            return res.status(502).json({
                message:
                    'NIBSS did not return a transaction reference'
            });
        }


        // ==================================
        // DETERMINE TRANSFER TYPE
        // ==================================

        let transferType;


        if (recipientBankCode) {

            transferType =
                String(
                    recipientBankCode
                ) ===
                String(
                    senderAccount.bankCode
                )
                    ? 'INTRA_BANK'
                    : 'INTER_BANK';

        } else {

            const sameBank =
                recipientBank &&
                senderAccount.bankName &&
                recipientBank.toLowerCase() ===
                    senderAccount.bankName.toLowerCase();


            transferType =
                sameBank
                    ? 'INTRA_BANK'
                    : 'INTER_BANK';
        }


        // ==================================
        // SAVE SENDER TRANSACTION
        // ==================================

        const senderTransaction =
            await Transaction.create({

                customer:
                    req.user._id,

                transactionId,

                from:
                    transferData?.senderAccount ||
                    senderAccount.accountNumber,

                to:
                    transferData?.receiverAccount ||
                    to,

                amount:
                    Number(
                        transferData?.amount
                    ) ||
                    numericAmount,

                // Sender is debited
                direction: 'DEBIT',

                recipientName,

                recipientBank,

                transferType,

                status:
                    transferData?.status || 'SUCCESS'
            });


        // ==================================
        // CHECK FOR LOCAL RECIPIENT
        // ==================================

        /*
            If recipient belongs to MART_TECH,
            their Account will exist in our
            MongoDB database.
        */

        const localRecipientAccount =
            await Account.findOne({
                accountNumber: to
            });


        // ==================================
        // SAVE RECIPIENT CREDIT TRANSACTION
        // ==================================

        /*
            Only create a credit history record
            when:

            1. Recipient belongs to our bank/app
            2. NIBSS says transfer succeeded
        */

        const transferStatus =
            transferData?.status || 'SUCCESS';


        if (
            localRecipientAccount &&
            transferStatus === 'SUCCESS'
        ) {
            try {
                await Transaction.create({

                    customer:
                        localRecipientAccount.customer,

                    transactionId,

                    from:
                        transferData?.senderAccount ||
                        senderAccount.accountNumber,

                    to:
                        transferData?.receiverAccount ||
                        to,

                    amount:
                        Number(
                            transferData?.amount
                        ) ||
                        numericAmount,

                    // Recipient is credited
                    direction: 'CREDIT',

                    recipientName,

                    recipientBank,

                    transferType,

                    status:
                        transferStatus
                });

            } catch (creditError) {

                /*
                    NIBSS transfer has already succeeded.

                    A failure to create the local CREDIT
                    history must NOT tell the sender that
                    the actual transfer failed.
                */

                console.error(
                    'Failed to save recipient credit history:',
                    creditError.message
                );
            }
        }


        // ==================================
        // RESPONSE
        // ==================================

        return res.status(200).json({
            message:
                'Transfer successful',

            transaction: {

                transactionId:
                    senderTransaction.transactionId,

                from:
                    senderTransaction.from,

                to:
                    senderTransaction.to,

                amount:
                    senderTransaction.amount,

                direction:
                    senderTransaction.direction,

                recipientName:
                    senderTransaction.recipientName,

                recipientBank:
                    senderTransaction.recipientBank,

                transferType:
                    senderTransaction.transferType,

                status:
                    senderTransaction.status,

                createdAt:
                    senderTransaction.createdAt
            }
        });

    } catch (error) {

        console.error(
            'Transfer error:',
            error.message
        );


        return res
            .status(
                error.status || 500
            )
            .json({
                message:
                    'Transfer failed',

                error:
                    error.message
            });
    }
};


// ==========================================
// TRANSACTION HISTORY
// ==========================================

exports.getMyTransactions = async (req, res) => {

        try {

            const transactions =
                await Transaction.find({
                    customer:
                        req.user._id
                })
                    .sort({
                        createdAt: -1
                    });


            return res.status(200).json({

                message:
                    'Transaction history retrieved successfully',

                count:
                    transactions.length,

                transactions
            });

        } catch (error) {

            console.error(
                'Transaction history error:',
                error.message
            );


            return res.status(500).json({
                message:
                    'Failed to retrieve transaction history'
            });
        }
    };


// ==========================================
// TRANSACTION STATUS
// ==========================================

exports.getTransactionStatus = async (req, res) => {

        try {

            const {
                transactionId
            } = req.params;


            // ==================================
            // VERIFY TRANSACTION OWNERSHIP
            // ==================================

            const transaction =
                await Transaction.findOne({

                    transactionId,

                    customer:
                        req.user._id
                });


            if (!transaction) {

                return res.status(404).json({
                    message:
                        'Transaction not found'
                });
            }


            // ==================================
            // GET CURRENT STATUS FROM NIBSS
            // ==================================

            const response =
                await nibss.transactionStatus(
                    transactionId
                );


            const result =
                response.data?.data ||
                response.data?.transaction ||
                response.data;


            // ==================================
            // UPDATE LOCAL STATUS
            // ==================================

            if (result?.status) {

                transaction.status =
                    result.status;

                await transaction.save();
            }


            return res.status(200).json({

                message:
                    'Transaction status retrieved successfully',

                transaction:
                    result
            });

        } catch (error) {

            console.error(
                'Transaction status error:',
                error.message
            );


            return res
                .status(
                    error.status || 500
                )
                .json({

                    message:
                        'Failed to retrieve transaction status',

                    error:
                        error.message
                });
        }
    };