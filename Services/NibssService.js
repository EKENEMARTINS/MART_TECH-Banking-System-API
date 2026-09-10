const axios = require('axios');

const nibssApi = axios.create({
    baseURL: process.env.NIBSS_BASE_URL,

    headers: {
        'Content-Type': 'application/json'
    },

    timeout: 30000
});

let cachedToken = null;
let tokenExpiresAt = 0;


// ==========================================
// NORMALIZE NIBSS ERRORS
// ==========================================

const normalizeNibssError = (error) => {
    // Already normalized
    if (error.nibssError) {
        return error;
    }

    const message =
        error.response?.data?.message ||
        error.message ||
        'NIBSS service unavailable';

    const normalizedError =
        new Error(message);

    normalizedError.status =
        error.response?.status || 502;

    normalizedError.nibssError = true;

    return normalizedError;
};


// ==========================================
// GET NIBSS JWT
// ==========================================

const getNibssToken = async () => {
    if (
        cachedToken &&
        Date.now() < tokenExpiresAt
    ) {
        return cachedToken;
    }

    try {
        const response =
            await nibssApi.post(
                '/api/auth/token',
                {
                    apiKey:
                        process.env.NIBSS_API_KEY,

                    apiSecret:
                        process.env.NIBSS_API_SECRET
                }
            );

        if (!response.data?.token) {
            throw new Error(
                'NIBSS authentication did not return a token'
            );
        }

        cachedToken = response.data.token;

        // NIBSS token expires after 1 hour.
        // Refresh after 55 minutes.
        tokenExpiresAt =
            Date.now() +
            55 * 60 * 1000;

        return cachedToken;

    } catch (error) {
        throw normalizeNibssError(error);
    }
};


// ==========================================
// PROTECTED REQUEST
// ==========================================

const protectedRequest =
    async (config, retry = true) => {

        try {
            const token =
                await getNibssToken();

            return await nibssApi({
                ...config,

                headers: {
                    ...config.headers,

                    Authorization:
                        `Bearer ${token}`
                }
            });

        } catch (error) {

            /*
              If NIBSS unexpectedly invalidates the cached
              token, get a new token and retry once.
            */

            if (
                retry &&
                error.response?.status === 401
            ) {
                cachedToken = null;
                tokenExpiresAt = 0;

                return protectedRequest(
                    config,
                    false
                );
            }

            throw normalizeNibssError(error);
        }
    };


// ==========================================
// BVN
// ==========================================

exports.createBvn = async (data) => {
    return protectedRequest({
        method: 'POST',
        url: '/api/insertBvn',
        data
    });
};


exports.validateBvn = async (bvn) => {
    return protectedRequest({
        method: 'POST',
        url: '/api/validateBvn',
        data: { bvn }
    });
};


// ==========================================
// NIN
// ==========================================

exports.createNin = async (data) => {
    return protectedRequest({
        method: 'POST',
        url: '/api/insertNin',
        data
    });
};


exports.validateNin = async (nin) => {
    return protectedRequest({
        method: 'POST',
        url: '/api/validateNin',
        data: { nin }
    });
};


// ==========================================
// ACCOUNT
// ==========================================

exports.createAccount = async (data) => {
    return protectedRequest({
        method: 'POST',
        url: '/api/account/create',
        data
    });
};


exports.nameEnquiry =
    async (accountNumber) => {

        return protectedRequest({
            method: 'GET',

            url:
                `/api/account/name-enquiry/${encodeURIComponent(
                    accountNumber
                )}`
        });
    };


exports.getBalance =
    async (accountNumber) => {

        return protectedRequest({
            method: 'GET',

            url:
                `/api/account/balance/${encodeURIComponent(
                    accountNumber
                )}`
        });
    };


// ==========================================
// TRANSFER
// ==========================================

exports.transfer = async (data) => {
    return protectedRequest({
        method: 'POST',
        url: '/api/transfer',
        data
    });
};


// ==========================================
// TRANSACTION STATUS
// ==========================================

exports.transactionStatus =
    async (transactionId) => {

        return protectedRequest({
            method: 'GET',

            url:
                `/api/transaction/${encodeURIComponent(
                    transactionId
                )}`
        });
    };