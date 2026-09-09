const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("."));

const PORT = process.env.PORT || 3000;


// =====================================
// GMAIL TRANSPORTER
// =====================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// =====================================
// OTP STORAGE
// =====================================

const otpStore = new Map();


// =====================================
// GENERATE OTP
// =====================================

function generateOTP() {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}


// =====================================
// GENERATE VERIFICATION TOKEN
// =====================================

function generateVerificationToken(email, otp) {

    const data =
        `${email}:${otp}:${Date.now()}`;

    return crypto
        .createHmac(
            "sha256",
            process.env.EMAIL_PASS
        )
        .update(data)
        .digest("hex");
}


// =====================================
// GENERATE OTP
// =====================================

app.post(
    "/api/auth/generate-otp",
    async (req, res) => {

        try {

            const { email } = req.body;

            if (!email) {

                return res.status(400).json({
                    message: "Email is required."
                });
            }


            const otp = generateOTP();


            // Store OTP for 5 minutes
            otpStore.set(email, {
                otp: otp,
                expiresAt:
                    Date.now() + 5 * 60 * 1000
            });


            // Send OTP to user's email
            await transporter.sendMail({

                from:
                    `"CommunityERP" <${process.env.EMAIL_USER}>`,

                to: email,

                subject:
                    "CommunityERP - Verification Code",

                html: `
                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 500px;
                        margin: auto;
                        padding: 20px;
                    ">

                        <h2 style="
                            color: #6c4cff;
                        ">
                            CommunityERP
                        </h2>

                        <p>Hello,</p>

                        <p>
                            Your verification code for the
                            CommunityERP Super Admin Console is:
                        </p>

                        <div style="
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            padding: 20px;
                            background: #f4f2ff;
                            text-align: center;
                            border-radius: 10px;
                            margin: 20px 0;
                        ">
                            ${otp}
                        </div>

                        <p>
                            This code will expire in
                            <strong>5 minutes</strong>.
                        </p>

                        <p>
                            If you did not request this code,
                            you can safely ignore this email.
                        </p>

                        <p>
                            Regards,<br>
                            CommunityERP Team
                        </p>

                    </div>
                `
            });


            console.log(
                `OTP sent to ${email}`
            );


            const verificationToken =
                generateVerificationToken(
                    email,
                    otp
                );


            return res.json({

                message:
                    "Verification code sent successfully.",

                verificationToken:
                    verificationToken
            });

        } catch (error) {

            console.error(
                "Email sending error:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to send verification code."
            });
        }
    }
);


// =====================================
// VERIFY OTP
// =====================================

app.post(
    "/api/auth/verify-otp",
    (req, res) => {

        try {

            const {
                email,
                otp,
                verificationToken
            } = req.body;


            if (
                !email ||
                !otp ||
                !verificationToken
            ) {

                return res.status(400).json({

                    message:
                        "Email, OTP and verification token are required."
                });
            }


            const storedData =
                otpStore.get(email);


            if (!storedData) {

                return res.status(400).json({

                    message:
                        "OTP not found. Please request a new OTP."
                });
            }


            // Check OTP expiration
            if (
                Date.now() >
                storedData.expiresAt
            ) {

                otpStore.delete(email);

                return res.status(400).json({

                    message:
                        "OTP has expired. Please request a new OTP."
                });
            }


            // Check OTP
            if (
                storedData.otp !== otp
            ) {

                return res.status(401).json({

                    message:
                        "Invalid OTP."
                });
            }


            // OTP successfully verified
            otpStore.delete(email);


            return res.json({

                message:
                    "OTP verified successfully.",

                authenticated:
                    true
            });

        } catch (error) {

            console.error(
                "OTP verification error:",
                error
            );

            return res.status(500).json({

                message:
                    "OTP verification failed."
            });
        }
    }
);


// =====================================
// HEALTH CHECK
// =====================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            status: "UP",

            application:
                "CommunityERP"
        });
    }
);


// =====================================
// LOCAL SERVER
// =====================================

if (require.main === module) {

    app.listen(
        PORT,
        () => {

            console.log(
                `CommunityERP server running on port ${PORT}`
            );
        }
    );
}


// =====================================
// EXPORT FOR VERCEL
// =====================================

module.exports = app;