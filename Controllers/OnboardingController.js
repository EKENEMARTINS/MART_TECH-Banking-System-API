const User = require('../Models/User');
const nibss = require('../Services/NibssService');


// ==========================================
// BVN ONBOARDING
// ==========================================

exports.onboardWithBvn =
    async (req, res) => {

        try {
            const user = req.user;
            const { bvn } = req.body;

            if (user.isVerified) {
                return res.status(400).json({
                    message:
                        'Customer has already completed verification'
                });
            }

            if (!bvn) {
                return res.status(400).json({
                    message:
                        'BVN is required'
                });
            }

            if (!/^\d{11}$/.test(bvn)) {
                return res.status(400).json({
                    message:
                        'BVN must contain exactly 11 digits'
                });
            }

            // Create simulated BVN on NIBSS
            await nibss.createBvn({
                bvn,

                firstName:
                    user.firstName,

                lastName:
                    user.lastName,

                dob:
                    user.dob,

                phone:
                    user.phone
            });

            // Validate BVN
            const validation =
                await nibss.validateBvn(
                    bvn
                );

            /*
              Live BVN response:

              {
                  success: true,
                  message: "...",
                  data: {
                      bvn,
                      firstName,
                      lastName,
                      dob,
                      phone
                  }
              }
            */

            if (
                !validation.data?.success ||
                !validation.data?.data
            ) {
                return res.status(400).json({
                    message:
                        'BVN verification failed'
                });
            }

            const identity =
                validation.data.data;

            if (
                String(identity.bvn) !==
                String(bvn)
            ) {
                return res.status(400).json({
                    message:
                        'BVN returned by NIBSS does not match submitted BVN'
                });
            }

            const nibssDob =
                identity.dob
                    ? identity.dob.split('T')[0]
                    : null;

            const namesMatch =
                identity.firstName
                    ?.trim()
                    .toLowerCase() ===
                    user.firstName
                        .trim()
                        .toLowerCase() &&

                identity.lastName
                    ?.trim()
                    .toLowerCase() ===
                    user.lastName
                        .trim()
                        .toLowerCase();

            const dobMatches =
                nibssDob === user.dob;

            if (
                !namesMatch ||
                !dobMatches
            ) {
                return res.status(400).json({
                    message:
                        'BVN identity does not match customer details'
                });
            }

            user.kycType = 'bvn';
            user.kycID = bvn;
            user.isVerified = true;

            await user.save();

            return res.status(200).json({
                message:
                    'BVN onboarding and verification successful',

                verified: true,
                kycType: 'bvn'
            });

        } catch (error) {
            console.error(
                'BVN onboarding error:',
                error.message
            );

            return res
                .status(error.status || 500)
                .json({
                    message:
                        'BVN onboarding failed',

                    error:
                        error.message
                });
        }
    };


// ==========================================
// NIN ONBOARDING
// ==========================================

exports.onboardWithNin =
    async (req, res) => {

        try {
            const user = req.user;
            const { nin } = req.body;

            if (user.isVerified) {
                return res.status(400).json({
                    message:
                        'Customer has already completed verification'
                });
            }

            if (!nin) {
                return res.status(400).json({
                    message:
                        'NIN is required'
                });
            }

            if (!/^\d{11}$/.test(nin)) {
                return res.status(400).json({
                    message:
                        'NIN must contain exactly 11 digits'
                });
            }

            // Create simulated NIN
            await nibss.createNin({
                nin,

                firstName:
                    user.firstName,

                lastName:
                    user.lastName,

                dob:
                    user.dob
            });

            // Validate simulated NIN
            const validation =
                await nibss.validateNin(
                    nin
                );

            /*
              Live NIN response:

              {
                  message: "NIN Verified!!",
                  response: {
                      nin,
                      firstName,
                      lastName,
                      dob
                  }
              }
            */

            const identity =
                validation.data?.response;

            if (!identity?.nin) {
                return res.status(400).json({
                    message:
                        'NIN verification failed'
                });
            }

            if (
                String(identity.nin) !==
                String(nin)
            ) {
                return res.status(400).json({
                    message:
                        'NIN returned by NIBSS does not match submitted NIN'
                });
            }

            const nibssDob =
                identity.dob
                    ? identity.dob.split('T')[0]
                    : null;

            const namesMatch =
                identity.firstName
                    ?.trim()
                    .toLowerCase() ===
                    user.firstName
                        .trim()
                        .toLowerCase() &&

                identity.lastName
                    ?.trim()
                    .toLowerCase() ===
                    user.lastName
                        .trim()
                        .toLowerCase();

            const dobMatches =
                nibssDob === user.dob;

            if (
                !namesMatch ||
                !dobMatches
            ) {
                return res.status(400).json({
                    message:
                        'NIN identity does not match customer details'
                });
            }

            user.kycType = 'nin';
            user.kycID = nin;
            user.isVerified = true;

            await user.save();

            return res.status(200).json({
                message:
                    'NIN onboarding and verification successful',

                verified: true,
                kycType: 'nin'
            });

        } catch (error) {
            console.error(
                'NIN onboarding error:',
                error.message
            );

            return res
                .status(error.status || 500)
                .json({
                    message:
                        'NIN onboarding failed',

                    error:
                        error.message
                });
        }
    };