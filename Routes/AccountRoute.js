const express =
    require('express');

const {
    createAccount,
    getMyAccount,
    getBalance,
    nameEnquiry
} = require(
    '../Controllers/AccountController'
);

const {
    protect
} = require(
    '../Middleware/auth'
);

const router =
    express.Router();

router.post(
    '/create',
    protect,
    createAccount
);

router.get(
    '/me',
    protect,
    getMyAccount
);

router.get(
    '/balance',
    protect,
    getBalance
);

router.get(
    '/name-enquiry/:accountNumber',
    protect,
    nameEnquiry
);

module.exports = router;