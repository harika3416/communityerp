const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");

require("dotenv").config();

const app = express();


// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());


// =====================================
// FRONTEND
// =====================================

app.use(express.static(__dirname));


// =====================================
// HOME PAGE
// =====================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


// =====================================
// PORT
// =====================================

const PORT = process.env.PORT || 3000;


// =====================================
// GMAIL
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

    return crypto
        .randomInt(100000, 1000000)
        .toString();
}


// =====================================
// GENERATE TOKEN
// =====================================

function generateVerificationToken() {

    return crypto
        .randomBytes(32)
        .toString("hex");
}


// =====================================
// GENERATE OTP
// =====================================

app.post(
    "/api/auth/generate-otp",
    async (req, res) => {

        try {

            const email =
                String(req.body.email || "")
                    .trim()
                    .toLowerCase();


            if (!email) {

                return res.status(400).json({

                    message:
                        "Email is required."
                });
            }


            // Generate new OTP

            const otp =
                generateOTP();


            // Generate token

            const verificationToken =
                generateVerificationToken();


            // Store everything together

            otpStore.set(email, {

                otp: otp,

                verificationToken:
                    verificationToken,

                expiresAt:
                    Date.now() +
                    5 * 60 * 1000
            });


            // Send email

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
                `OTP sent successfully to ${email}`
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

            const email =
                String(req.body.email || "")
                    .trim()
                    .toLowerCase();

            const otp =
                String(req.body.otp || "")
                    .trim();

            const verificationToken =
                String(
                    req.body.verificationToken || ""
                ).trim();


            // Validate request

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


            // Get stored OTP

            const storedData =
                otpStore.get(email);


            if (!storedData) {

                return res.status(400).json({

                    message:
                        "OTP not found. Please request a new OTP."
                });
            }


            // Check expiration

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


            // Check verification token

            if (
                storedData.verificationToken !==
                verificationToken
            ) {

                return res.status(401).json({

                    message:
                        "Invalid verification session. Please request a new OTP."
                });
            }


            // Check OTP length

            if (otp.length !== 6) {

                return res.status(400).json({

                    message:
                        "OTP must contain 6 digits."
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


            // Successful verification

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
// VERCEL
// =====================================

module.exports = app;