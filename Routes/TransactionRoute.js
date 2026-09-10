const express = require('express');

const {
    transfer,
    getMyTransactions,
    getTransactionStatus
} = require(
    '../Controllers/TransactionController'
);

const {
    protect
} = require(
    '../Middleware/auth'
);

const router =
    express.Router();

router.post(
    '/transfer',
    protect,
    transfer
);

router.get(
    '/history',
    protect,
    getMyTransactions
);

router.get(
    '/status/:transactionId',
    protect,
    getTransactionStatus
);

module.exports = router;