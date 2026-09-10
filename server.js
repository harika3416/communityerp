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


// ============================================================
// DATA STORE
// ============================================================

const data = {
    users: [],
    homes: [],
    roles: [],
    policies: [],
    announcements: [],
    modules: [],
    activities: []
};


// Community configuration is intentionally empty.
// It will be populated through the configuration API.
let communityConfig = {};


// ============================================================
// COMMUNITY CONFIGURATION SCHEMA
// ============================================================

// This describes the fields available to the frontend.
// It is NOT sample/dummy community data.

const communityConfigSchema = {

    information: [
        {
            key: "communityName",
            label: "Community Name",
            type: "text"
        },
        {
            key: "communityType",
            label: "Type",
            type: "select",
            options: [
                "Gated Community",
                "Apartment Community",
                "Residential Society"
            ]
        },
        {
            key: "totalAuthorizedHomes",
            label: "Total Authorized Homes",
            type: "number"
        },
        {
            key: "contactPhone",
            label: "Contact Phone",
            type: "tel"
        }
    ],

    age: [
        {
            key: "minimumAgeRegistration",
            label: "Minimum Age for Registration",
            type: "number"
        },
        {
            key: "minimumAgePrimaryResident",
            label: "Minimum Age for Primary Resident",
            type: "number"
        }
    ],

    access: [
        {
            key: "tenantAppAccess",
            label: "Tenant App Access",
            description:
                "Allow tenants to use the mobile application."
        },
        {
            key: "tenantGateApproval",
            label: "Tenant Gate Approval",
            description:
                "Allow tenants to approve visitors directly."
        },
        {
            key: "tenantBillingVisibility",
            label: "Tenant Billing Visibility",
            description:
                "Show HOA dues to tenants."
        }
    ],

    sla: [
        {
            key: "complaintSecuritySla",
            label: "Security",
            type: "number"
        },
        {
            key: "complaintPlumbingSla",
            label: "Plumbing",
            type: "number"
        },
        {
            key: "complaintMaintenanceSla",
            label: "General Maintenance",
            type: "number"
        }
    ],

    complaintToggles: [
        {
            key: "autoEscalation",
            label: "Auto-Escalation",
            description:
                "Escalate to committee if SLA breached."
        },
        {
            key: "allowTicketReopen",
            label: "Allow Ticket Reopen",
            description:
                "Residents can reopen within 48h of closure."
        }
    ],

    billing: [
        {
            key: "billingCycle",
            label: "Billing Cycle",
            type: "select",
            options: [
                "Monthly (1st of Month)",
                "Monthly (5th of Month)",
                "Quarterly",
                "Annually"
            ]
        },
        {
            key: "gracePeriod",
            label: "Grace Period (Days)",
            type: "number"
        },
        {
            key: "lateFeeType",
            label: "Late Fee Type",
            type: "select",
            options: [
                "Fixed Amount",
                "Percentage"
            ]
        },
        {
            key: "lateFeeValue",
            label: "Late Fee Value",
            type: "number"
        }
    ],

    billingToggles: [
        {
            key: "allowOfflinePayments",
            label: "Allow Offline Payments",
            description:
                "Enable manual cash/check entry by admins."
        },
        {
            key: "disputeWorkflow",
            label: "Dispute Workflow",
            description:
                "Allow residents to contest line items before payment."
        }
    ]
};


// ============================================================
// ROLE / PERMISSION SCHEMA
// ============================================================

// This is permission metadata used to render the role screen.
// Actual roles are stored dynamically in data.roles.

const roleSchema = {

    identity: {
        nameLabel: "Role Name",
        namePlaceholder: "",
        descriptionLabel: "Description",
        descriptionPlaceholder: "",
        templateLabel: "Base Template (Optional)"
    },

    modules: [

        {
            key: "dashboard",

            name: "Dashboard & Analytics",

            description:
                "Access to overview metrics and reporting tools.",

            icon: "▦",

            defaultEnabled: false,

            permissions: [
                {
                    key: "view_reports",
                    label: "View Reports",
                    defaultChecked: false
                },
                {
                    key: "export_data",
                    label: "Export Data",
                    defaultChecked: false
                },
                {
                    key: "manage_widgets",
                    label: "Manage Widgets",
                    defaultChecked: false
                }
            ]
        },


        {
            key: "users",

            name: "Users & Access Control",

            description:
                "Manage user profiles, invitations, and role assignments.",

            icon: "♙",

            defaultEnabled: true,

            permissions: [
                {
                    key: "view_users",
                    label: "View Users",
                    defaultChecked: true
                },
                {
                    key: "invite_users",
                    label: "Invite Users",
                    defaultChecked: true
                },
                {
                    key: "manage_roles",
                    label: "Manage Roles",
                    defaultChecked: false
                },
                {
                    key: "delete_users",
                    label: "Delete Users",
                    defaultChecked: false
                }
            ]
        },


        {
            key: "system",

            name: "System Configuration",

            description:
                "Global settings affecting the entire tenant environment.",

            icon: "▣",

            defaultEnabled: false,

            permissions: [
                {
                    key: "view_config",
                    label: "View Config",
                    defaultChecked: false
                },
                {
                    key: "edit_settings",
                    label: "Edit Settings",
                    defaultChecked: false
                }
            ]
        }

    ]
};


// ============================================================
// OTP STORE
// ============================================================

const otpStore = new Map();


// ============================================================
// HELPERS
// ============================================================

function createId(prefix) {

    return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;

}


function activity(action, description) {

    const item = {

        id: createId("ACT"),

        action,

        description,

        createdAt:
            new Date().toISOString()

    };

    data.activities.unshift(item);

    // Keep only the latest 10 activities.
    data.activities.splice(10);

    return item;

}


function createItem(collection, prefix, fields) {

    const item = {

        id: createId(prefix),

        ...fields,

        createdAt:
            new Date().toISOString()

    };

    collection.push(item);

    return item;

}


function required(body, fields) {

    return fields.every(field => {

        const value = body[field];

        if (
            value === undefined ||
            value === null
        ) {

            return false;

        }

        return String(value).trim().length > 0;

    });

}


function normalizeString(value) {

    return String(value ?? "").trim();

}


function normalizeEmail(value) {

    return normalizeString(value).toLowerCase();

}


// ============================================================
// OTP AUTHENTICATION
// ============================================================

const transporter =
    nodemailer.createTransport({

        service: "gmail",

        auth: {

            user:
                process.env.EMAIL_USER,

            pass:
                process.env.EMAIL_PASS

        }

    });


// ------------------------------------------------------------
// GENERATE OTP
// ------------------------------------------------------------

app.post(
    "/api/auth/generate-otp",
    async (req, res) => {

        const email =
            normalizeEmail(req.body.email);


        if (!email) {

            return res.status(400).json({

                message:
                    "Email is required."

            });

        }


        const otp =
            crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();


        const verificationToken =
            crypto
                .randomBytes(32)
                .toString("hex");


        otpStore.set(
            email,
            {

                otp,

                token:
                    verificationToken,

                expiresAt:
                    Date.now() +
                    5 * 60 * 1000

            }
        );


        try {

            await transporter.sendMail({

                from:
                    `"CommunityERP" <${process.env.EMAIL_USER}>`,

                to:
                    email,

                subject:
                    "CommunityERP - Verification Code",

                html: `
                    <h2>CommunityERP</h2>

                    <p>
                        Your verification code is:
                    </p>

                    <h1>
                        ${otp}
                    </h1>

                    <p>
                        This code expires in 5 minutes.
                    </p>
                `

            });


            return res.json({

                message:
                    "Verification code sent successfully.",

                verificationToken

            });

        } catch (error) {

            console.error(
                "OTP email error:",
                error
            );


            return res.status(500).json({

                message:
                    "Failed to send verification code."

            });

        }

    }
);


// ------------------------------------------------------------
// VERIFY OTP
// ------------------------------------------------------------

app.post(
    "/api/auth/verify-otp",
    (req, res) => {

        const email =
            normalizeEmail(req.body.email);


        const otp =
            normalizeString(req.body.otp);


        const token =
            normalizeString(
                req.body.verificationToken
            );


        const stored =
            otpStore.get(email);


        if (!stored) {

            return res.status(400).json({

                message:
                    "OTP not found. Please request a new OTP."

            });

        }


        if (
            Date.now() >
            stored.expiresAt
        ) {

            otpStore.delete(email);

            return res.status(400).json({

                message:
                    "OTP has expired."

            });

        }


        if (
            stored.token !== token
        ) {

            return res.status(401).json({

                message:
                    "Invalid verification session."

            });

        }


        if (
            stored.otp !== otp
        ) {

            return res.status(401).json({

                message:
                    "Invalid OTP."

            });

        }


        otpStore.delete(email);


        activity(
            "Admin Login",
            `${email} logged into the console`
        );


        return res.json({

            message:
                "OTP verified successfully.",

            authenticated:
                true

        });

    }
);


// ============================================================
// DASHBOARD
// ============================================================

app.get(
    "/api/dashboard",
    (req, res) => {

        const users =
            data.users;


        const totalUsers =
            users.length;


        const activeUsers =
            users.filter(
                user =>
                    user.status === "Active"
            ).length;


        const pendingUsers =
            users.filter(
                user =>
                    user.status === "Pending"
            ).length;


        const suspendedUsers =
            users.filter(
                user =>
                    user.status === "Suspended"
            ).length;


        const totalHomes =
            data.homes.length;


        const pendingAccess =
            users.filter(
                user =>
                    user.accessStatus === "Pending"
            ).length;


        const fullyOnboarded =
            data.homes.filter(
                home =>
                    home.status === "Onboarded"
            ).length;


        const inProgress =
            data.homes.filter(
                home =>
                    home.status === "In Progress"
            ).length;


        const needsAttention =
            data.homes.filter(
                home =>
                    home.status === "Needs Attention"
            ).length;


        const progress =
            totalHomes > 0
                ? Math.round(
                    (
                        fullyOnboarded /
                        totalHomes
                    ) * 100
                )
                : 0;


        return res.json({

            stats: {

                totalUsers,

                activeUsers,

                totalHomes,

                pendingAccess

            },


            userOverview: {

                total:
                    totalUsers,

                active:
                    activeUsers,

                pending:
                    pendingUsers,

                suspended:
                    suspendedUsers

            },


            homeOnboarding: {

                progress,

                fullyOnboarded,

                inProgress,

                needsAttention

            },


            attentionRequired: {

                pendingAccess,

                homesNeedsAttention:
                    needsAttention,

                pendingGateApprovals:
                    0,

                vendorContractsDue:
                    0,

                slaBreachedComplaints:
                    0

            },


            recentActivity:
                data.activities

        });

    }
);


// ============================================================
// USERS
// ============================================================

// ------------------------------------------------------------
// GET USERS
// ------------------------------------------------------------

app.get(
    "/api/users",
    (req, res) => {

        return res.json(
            data.users
        );

    }
);


// ------------------------------------------------------------
// CREATE USER
// ------------------------------------------------------------

app.post(
    "/api/users",
    (req, res) => {

        const requiredFields = [

            "firstName",

            "lastName",

            "email",

            "role"

        ];


        if (
            !required(
                req.body,
                requiredFields
            )
        ) {

            return res.status(400).json({

                message:
                    "First name, last name, email and role are required."

            });

        }


        const email =
            normalizeEmail(
                req.body.email
            );


        const existingUser =
            data.users.find(
                user =>
                    user.email === email
            );


        if (existingUser) {

            return res.status(409).json({

                message:
                    "A user with this email already exists."

            });

        }


        const user =
            createItem(

                data.users,

                "USR",

                {

                    firstName:
                        normalizeString(
                            req.body.firstName
                        ),

                    lastName:
                        normalizeString(
                            req.body.lastName
                        ),

                    email,

                    phone:
                        normalizeString(
                            req.body.phone
                        ),

                    residence:
                        normalizeString(
                            req.body.residence
                        ),

                    moveInDate:
                        normalizeString(
                            req.body.moveInDate
                        ),

                    role:
                        normalizeString(
                            req.body.role
                        ),

                    status:
                        "Active",

                    accessStatus:
                        "Approved"

                }

            );


        activity(

            "User Created",

            `${user.firstName} ${user.lastName} was added`

        );


        return res.status(201).json({

            message:
                "User created successfully.",

            user

        });

    }
);


// ============================================================
// ANNOUNCEMENTS
// ============================================================

// ------------------------------------------------------------
// GET ANNOUNCEMENTS
// ------------------------------------------------------------

app.get(
    "/api/announcements",
    (req, res) => {

        return res.json(
            data.announcements
        );

    }
);


// ------------------------------------------------------------
// CREATE ANNOUNCEMENT
// ------------------------------------------------------------

app.post(
    "/api/announcements",
    (req, res) => {

        const fields = [

            "title",

            "category",

            "audience",

            "message"

        ];


        if (
            !required(
                req.body,
                fields
            )
        ) {

            return res.status(400).json({

                message:
                    "Title, category, audience and message are required."

            });

        }


        const announcement =
            createItem(

                data.announcements,

                "ANN",

                {

                    title:
                        normalizeString(
                            req.body.title
                        ),

                    category:
                        normalizeString(
                            req.body.category
                        ),

                    audience:
                        normalizeString(
                            req.body.audience
                        ),

                    message:
                        normalizeString(
                            req.body.message
                        ),

                    inAppNotice:
                        Boolean(
                            req.body.inAppNotice
                        ),

                    pushNotification:
                        Boolean(
                            req.body.pushNotification
                        ),

                    emailBroadcast:
                        Boolean(
                            req.body.emailBroadcast
                        ),

                    status:
                        "Published"

                }

            );


        activity(

            "Announcement Created",

            `"${announcement.title}" was published`

        );


        return res.status(201).json({

            message:
                "Announcement broadcast successfully.",

            announcement

        });

    }
);


// ============================================================
// COMMUNITY CONFIGURATION
// ============================================================

// ------------------------------------------------------------
// GET CURRENT CONFIGURATION
// ------------------------------------------------------------

app.get(
    "/api/community/config",
    (req, res) => {

        return res.json(
            communityConfig
        );

    }
);


// ------------------------------------------------------------
// GET CONFIGURATION SCHEMA
// ------------------------------------------------------------

app.get(
    "/api/community/config-schema",
    (req, res) => {

        return res.json(
            communityConfigSchema
        );

    }
);


// ------------------------------------------------------------
// GET CONFIGURATION ACTIVITY
// ------------------------------------------------------------

app.get(
    "/api/community/config/activity",
    (req, res) => {

        const activities =
            data.activities.filter(
                item =>
                    item.action ===
                    "Community Configuration Updated"
            );


        return res.json(
            activities
        );

    }
);


// ------------------------------------------------------------
// UPDATE CONFIGURATION
// ------------------------------------------------------------

app.put(
    "/api/community/config",
    (req, res) => {

        if (
            !req.body ||
            typeof req.body !== "object"
        ) {

            return res.status(400).json({

                message:
                    "Configuration data is required."

            });

        }


        communityConfig = {

            ...communityConfig,

            ...req.body

        };


        activity(

            "Community Configuration Updated",

            "Community configuration was updated"

        );


        return res.json({

            message:
                "Community configuration saved successfully.",

            config:
                communityConfig

        });

    }
);


// ============================================================
// ROLES
// ============================================================

// ------------------------------------------------------------
// GET ROLE/PERMISSION SCHEMA
// ------------------------------------------------------------

app.get(
    "/api/roles/schema",
    (req, res) => {

        const templates = [

            {
                value: "",
                label: "Start from scratch"
            },

            ...data.roles.map(
                role => ({

                    value:
                        role.id,

                    label:
                        role.name

                })
            )

        ];


        return res.json({

            identity:
                roleSchema.identity,

            modules:
                roleSchema.modules,

            templates

        });

    }
);


// ------------------------------------------------------------
// GET ROLES
// ------------------------------------------------------------

app.get(
    "/api/roles",
    (req, res) => {

        return res.json(
            data.roles
        );

    }
);


// ------------------------------------------------------------
// CREATE ROLE
// ------------------------------------------------------------

app.post(
    "/api/roles",
    (req, res) => {

        if (
            !required(
                req.body,
                ["name"]
            )
        ) {

            return res.status(400).json({

                message:
                    "Role name is required."

            });

        }


        const roleName =
            normalizeString(
                req.body.name
            );


        const duplicate =
            data.roles.find(
                role =>
                    role.name.toLowerCase() ===
                    roleName.toLowerCase()
            );


        if (duplicate) {

            return res.status(409).json({

                message:
                    "A role with this name already exists."

            });

        }


        const role =
            createItem(

                data.roles,

                "ROLE",

                {

                    name:
                        roleName,

                    description:
                        normalizeString(
                            req.body.description
                        ),

                    template:
                        normalizeString(
                            req.body.template
                        ),

                    permissions:
                        req.body.permissions &&
                        typeof req.body.permissions === "object"
                            ? req.body.permissions
                            : {}

                }

            );


        activity(

            "Role Created",

            `${role.name} role was created`

        );


        return res.status(201).json({

            message:
                "Role created successfully.",

            role

        });

    }
);


// ============================================================
// HOMES / HOUSEHOLDS
// ============================================================

// ------------------------------------------------------------
// GET HOMES
// ------------------------------------------------------------

app.get(
    "/api/homes",
    (req, res) => {

        return res.json(
            data.homes
        );

    }
);


// ------------------------------------------------------------
// CREATE HOUSEHOLD
// ------------------------------------------------------------

app.post(
    "/api/homes",
    (req, res) => {

        if (
            !required(
                req.body,
                ["name", "unit"]
            )
        ) {

            return res.status(400).json({

                message:
                    "Household name and unit are required."

            });

        }


        const unit =
            normalizeString(
                req.body.unit
            );


        const existingHome =
            data.homes.find(
                home =>
                    String(
                        home.unit || ""
                    ).toLowerCase() ===
                    unit.toLowerCase()
            );


        if (existingHome) {

            return res.status(409).json({

                message:
                    "A household already exists for this unit."

            });

        }


        const home =
            createItem(

                data.homes,

                "HOME",

                {

                    name:
                        normalizeString(
                            req.body.name
                        ),

                    unit,

                    memberType:
                        normalizeString(
                            req.body.memberType
                        ),

                    status:
                        normalizeString(
                            req.body.status
                        ) ||
                        "In Progress"

                }

            );


        activity(

            "Household Added",

            `${home.name} was added`

        );


        return res.status(201).json({

            message:
                "Household created successfully.",

            household:
                home

        });

    }
);


// ------------------------------------------------------------
// UPDATE HOUSEHOLD
// ------------------------------------------------------------

app.put(
    "/api/homes/:id",
    (req, res) => {

        const home =
            data.homes.find(
                item =>
                    item.id ===
                    req.params.id
            );


        if (!home) {

            return res.status(404).json({

                message:
                    "Household not found."

            });

        }


        if (
            req.body &&
            typeof req.body === "object"
        ) {

            Object.assign(
                home,
                req.body
            );

        }


        activity(

            "Household Updated",

            `${home.name || home.unit} was updated`

        );


        return res.json({

            message:
                "Household updated successfully.",

            household:
                home

        });

    }
);


// ============================================================
// POLICIES
// ============================================================

// ------------------------------------------------------------
// GET POLICIES
// ------------------------------------------------------------

app.get(
    "/api/policies",
    (req, res) => {

        return res.json(
            data.policies
        );

    }
);


// ------------------------------------------------------------
// CREATE / UPDATE POLICY
// ------------------------------------------------------------

app.post(
    "/api/policies",
    (req, res) => {

        if (
            !required(
                req.body,
                ["title"]
            )
        ) {

            return res.status(400).json({

                message:
                    "Policy title is required."

            });

        }


        const policy =
            createItem(

                data.policies,

                "POL",

                {

                    title:
                        normalizeString(
                            req.body.title
                        ),

                    description:
                        normalizeString(
                            req.body.description
                        )

                }

            );


        activity(

            "Policy Updated",

            `${policy.title} was updated`

        );


        return res.status(201).json({

            message:
                "Policy updated successfully.",

            policy

        });

    }
);


// ============================================================
// MODULES
// ============================================================

// ------------------------------------------------------------
// GET MODULES
// ------------------------------------------------------------

app.get(
    "/api/modules",
    (req, res) => {

        return res.json(
            data.modules
        );

    }
);


// ------------------------------------------------------------
// CREATE MODULE
// ------------------------------------------------------------

app.post(
    "/api/modules",
    (req, res) => {

        if (
            !required(
                req.body,
                ["name"]
            )
        ) {

            return res.status(400).json({

                message:
                    "Module name is required."

            });

        }


        const module =
            createItem(

                data.modules,

                "MOD",

                {

                    name:
                        normalizeString(
                            req.body.name
                        ),

                    enabled:
                        req.body.enabled !== false

                }

            );


        activity(

            "Module Configured",

            `${module.name} module was configured`

        );


        return res.status(201).json({

            message:
                "Module configured successfully.",

            module

        });

    }
);


// ============================================================
// ACTIVITY
// ============================================================

// ------------------------------------------------------------
// GET ACTIVITIES
// ------------------------------------------------------------

app.get(
    "/api/activities",
    (req, res) => {

        return res.json(
            data.activities
        );

    }
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
    "/api/health",
    (req, res) => {

        return res.json({

            status:
                "UP",

            application:
                "CommunityERP"

        });

    }
);


// ============================================================
// FALLBACK
// ============================================================

// Allows the frontend application to be served normally.

app.get(
    "/{*splat}",
    (req, res) => {

        if (
            req.path.startsWith("/api/")
        ) {

            return res.status(404).json({

                message:
                    "API endpoint not found."

            });

        }


        return res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Unhandled server error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(error);

        }


        return res.status(500).json({

            message:
                "Internal server error."

        });

    }
);


// ============================================================
// START SERVER
// ============================================================

if (
    require.main === module
) {

    app.listen(
        PORT,
        () => {

            console.log(
                `CommunityERP server running on port ${PORT}`
            );

        }
    );

}


module.exports = app;