const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// ==============================
// DATA
// ==============================

const data = {
    users: [],
    homes: [],
    roles: [],
    policies: [],
    announcements: [],
    modules: [],
    activities: []
};

const otpStore = new Map();


// ==============================
// HELPERS
// ==============================

const id = prefix =>
    `${prefix}-${crypto.randomBytes(6).toString("hex")}`;

function activity(action, description) {
    data.activities.unshift({
        id: id("ACT"),
        action,
        description,
        createdAt: new Date().toISOString()
    });

    data.activities.splice(10);
}

function createItem(collection, prefix, fields) {
    const item = {
        id: id(prefix),
        ...fields,
        createdAt: new Date().toISOString()
    };

    collection.push(item);
    return item;
}

function required(body, fields) {
    return fields.every(
        field =>
            String(body[field] || "").trim()
    );
}


// ==============================
// OTP
// ==============================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


app.post("/api/auth/generate-otp", async (req, res) => {

    const email =
        String(req.body.email || "")
            .trim()
            .toLowerCase();

    if (!email)
        return res.status(400).json({
            message: "Email is required."
        });

    const otp =
        crypto.randomInt(100000, 1000000).toString();

    const token =
        crypto.randomBytes(32).toString("hex");

    otpStore.set(email, {
        otp,
        token,
        expiresAt: Date.now() + 5 * 60 * 1000
    });

    try {

        await transporter.sendMail({
            from: `"CommunityERP" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "CommunityERP - Verification Code",
            html: `
                <h2>CommunityERP</h2>
                <p>Your verification code is:</p>
                <h1>${otp}</h1>
                <p>This code expires in 5 minutes.</p>
            `
        });

        res.json({
            message: "Verification code sent successfully.",
            verificationToken: token
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to send verification code."
        });
    }
});


app.post("/api/auth/verify-otp", (req, res) => {

    const email =
        String(req.body.email || "")
            .trim()
            .toLowerCase();

    const otp =
        String(req.body.otp || "").trim();

    const token =
        String(req.body.verificationToken || "").trim();

    const stored = otpStore.get(email);

    if (!stored)
        return res.status(400).json({
            message: "OTP not found. Please request a new OTP."
        });

    if (Date.now() > stored.expiresAt) {

        otpStore.delete(email);

        return res.status(400).json({
            message: "OTP has expired."
        });
    }

    if (stored.token !== token)
        return res.status(401).json({
            message: "Invalid verification session."
        });

    if (stored.otp !== otp)
        return res.status(401).json({
            message: "Invalid OTP."
        });

    otpStore.delete(email);

    activity(
        "Admin Login",
        `${email} logged into the console`
    );

    res.json({
        message: "OTP verified successfully.",
        authenticated: true
    });
});


// ==============================
// DASHBOARD
// ==============================

app.get("/api/dashboard", (req, res) => {

    const users = data.users;

    const totalUsers = users.length;

    const activeUsers =
        users.filter(u => u.status === "Active").length;

    const pendingUsers =
        users.filter(u => u.status === "Pending").length;

    const suspendedUsers =
        users.filter(u => u.status === "Suspended").length;

    const totalHomes = data.homes.length;

    const pendingAccess =
        users.filter(
            u => u.accessStatus === "Pending"
        ).length;

    const fullyOnboarded =
        data.homes.filter(
            h => h.status === "Onboarded"
        ).length;

    const inProgress =
        data.homes.filter(
            h => h.status === "In Progress"
        ).length;

    const needsAttention =
        data.homes.filter(
            h => h.status === "Needs Attention"
        ).length;

    const progress =
        totalHomes
            ? Math.round(
                fullyOnboarded / totalHomes * 100
            )
            : 0;

    res.json({

        stats: {
            totalUsers,
            activeUsers,
            totalHomes,
            pendingAccess
        },

        userOverview: {
            total: totalUsers,
            active: activeUsers,
            pending: pendingUsers,
            suspended: suspendedUsers
        },

        homeOnboarding: {
            progress,
            fullyOnboarded,
            inProgress,
            needsAttention
        },

        attentionRequired: {
            pendingAccess,
            homesNeedsAttention: needsAttention,
            pendingGateApprovals: 0,
            vendorContractsDue: 0,
            slaBreachedComplaints: 0
        },

        recentActivity: data.activities

    });
});


// ==============================
// USERS
// ==============================

app.get("/api/users", (req, res) => {
    res.json(data.users);
});


app.post("/api/users", (req, res) => {

    const fields = [
        "firstName",
        "lastName",
        "email",
        "role"
    ];

    if (!required(req.body, fields))
        return res.status(400).json({
            message:
                "First name, last name, email and role are required."
        });

    const email =
        req.body.email.trim().toLowerCase();

    if (
        data.users.some(
            user => user.email === email
        )
    )
        return res.status(409).json({
            message:
                "A user with this email already exists."
        });

    const user = createItem(
        data.users,
        "USR",
        {
            firstName: req.body.firstName.trim(),
            lastName: req.body.lastName.trim(),
            email,
            phone: req.body.phone || "",
            residence: req.body.residence || "",
            moveInDate: req.body.moveInDate || "",
            role: req.body.role,
            status: "Active",
            accessStatus: "Approved"
        }
    );

    activity(
        "User Created",
        `${user.firstName} ${user.lastName} was added`
    );

    res.status(201).json({
        message: "User created successfully.",
        user
    });
});


// ==============================
// ANNOUNCEMENTS
// ==============================

app.get("/api/announcements", (req, res) => {
    res.json(data.announcements);
});


app.post("/api/announcements", (req, res) => {

    if (
        !required(
            req.body,
            ["title", "category", "audience", "message"]
        )
    )
        return res.status(400).json({
            message:
                "Title, category, audience and message are required."
        });

    const announcement = createItem(
        data.announcements,
        "ANN",
        {
            title: req.body.title.trim(),
            category: req.body.category,
            audience: req.body.audience,
            message: req.body.message.trim(),
            inAppNotice: !!req.body.inAppNotice,
            pushNotification: !!req.body.pushNotification,
            emailBroadcast: !!req.body.emailBroadcast,
            status: "Published"
        }
    );

    activity(
        "Announcement Created",
        `"${announcement.title}" was published`
    );

    res.status(201).json({
        message:
            "Announcement broadcast successfully.",
        announcement
    });
});


// ==============================
// QUICK ACTIONS
// ==============================

app.post("/api/roles", (req, res) => {

    if (!required(req.body, ["name"]))
        return res.status(400).json({
            message: "Role name is required."
        });

    const role = createItem(
        data.roles,
        "ROLE",
        {
            name: req.body.name.trim(),
            description: req.body.description || ""
        }
    );

    activity(
        "Role Created",
        `${role.name} role was created`
    );

    res.status(201).json({
        message: "Role created successfully.",
        role
    });
});


app.post("/api/homes", (req, res) => {

    if (!required(req.body, ["name", "unit"]))
        return res.status(400).json({
            message:
                "Household name and unit are required."
        });

    const home = createItem(
        data.homes,
        "HOME",
        {
            name: req.body.name.trim(),
            unit: req.body.unit.trim(),
            status:
                req.body.status || "In Progress"
        }
    );

    activity(
        "Household Added",
        `${home.name} was added`
    );

    res.status(201).json({
        message:
            "Household created successfully.",
        household: home
    });
});


app.post("/api/policies", (req, res) => {

    if (!required(req.body, ["title"]))
        return res.status(400).json({
            message: "Policy title is required."
        });

    const policy = createItem(
        data.policies,
        "POL",
        {
            title: req.body.title.trim(),
            description: req.body.description || ""
        }
    );

    activity(
        "Policy Updated",
        `${policy.title} was updated`
    );

    res.status(201).json({
        message: "Policy updated successfully.",
        policy
    });
});


app.post("/api/modules", (req, res) => {

    if (!required(req.body, ["name"]))
        return res.status(400).json({
            message: "Module name is required."
        });

    const module = createItem(
        data.modules,
        "MOD",
        {
            name: req.body.name.trim(),
            enabled: req.body.enabled !== false
        }
    );

    activity(
        "Module Configured",
        `${module.name} module was configured`
    );

    res.status(201).json({
        message: "Module configured successfully.",
        module
    });
});


// ==============================
// HEALTH
// ==============================

app.get("/api/health", (req, res) => {

    res.json({
        status: "UP",
        application: "CommunityERP"
    });

});


// ==============================
// SERVER
// ==============================

if (require.main === module) {

    app.listen(PORT, () => {

        console.log(
            `CommunityERP server running on port ${PORT}`
        );

    });

}

module.exports = app;