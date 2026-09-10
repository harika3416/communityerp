// ============================================================
// COMMUNITYERP - COMPLETE FRONTEND JAVASCRIPT
// ============================================================

// ============================================================
// ELEMENTS
// ============================================================

const loginScreen = document.getElementById("loginScreen");
const otpScreen = document.getElementById("otpScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

const emailInput = document.getElementById("emailInput");
const generateBtn = document.getElementById("generateBtn");
const verifyBtn = document.getElementById("verifyBtn");

const otpInputs = document.querySelectorAll(".otp-input");

const loginMessage = document.getElementById("loginMessage");
const otpMessage = document.getElementById("otpMessage");

const logoutBtn = document.getElementById("logoutBtn");

const dashboardContent =
    document.getElementById("dashboardContent");

const moduleContent =
    document.getElementById("moduleContent");

const quickActionsModal =
    document.getElementById("quickActionsModal");

const addUserModal =
    document.getElementById("addUserModal");

const announcementModal =
    document.getElementById("announcementModal");

const genericActionModal =
    document.getElementById("genericActionModal");

const newActionBtn =
    document.getElementById("newActionBtn");


// ============================================================
// AUTH STATE
// ============================================================

let currentEmail = "";
let verificationToken = "";


// ============================================================
// HELPERS
// ============================================================

function show(element) {
    element?.classList.remove("hidden");
}


function hide(element) {
    element?.classList.add("hidden");
}


function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function number(value) {
    return Number(value || 0).toLocaleString();
}


function message(element, text, type = "") {
    if (!element) return;

    element.textContent = text;
    element.className = `message ${type}`;
}


function setStatus(id, text, type = "") {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = text;
    element.className = `module-status ${type}`;
}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


async function api(url, options = {}) {

    const response = await fetch(url, {
        ...options,

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Something went wrong."
        );
    }

    return data;
}


// ============================================================
// DATE
// ============================================================

function updateDashboardDate() {

    const element =
        document.getElementById("dashboardDate");

    if (!element) return;

    element.textContent =
        new Date().toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );
}


// ============================================================
// LOGIN - GENERATE OTP
// ============================================================

generateBtn?.addEventListener(
    "click",
    async () => {

        const email =
            emailInput?.value.trim();

        if (!email) {

            message(
                loginMessage,
                "Please enter your email address.",
                "error"
            );

            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = "Sending...";

        try {

            const result =
                await api(
                    "/api/auth/generate-otp",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            email
                        })
                    }
                );

            currentEmail = email;

            verificationToken =
                result.verificationToken;

            hide(loginScreen);
            show(otpScreen);

            message(
                otpMessage,
                result.message,
                "success"
            );

            otpInputs[0]?.focus();

        } catch (error) {

            message(
                loginMessage,
                error.message,
                "error"
            );

        } finally {

            generateBtn.disabled = false;

            generateBtn.innerHTML =
                "<span>Generate OTP</span><span>→</span>";
        }
    }
);


// ============================================================
// OTP INPUT
// ============================================================

otpInputs.forEach(
    (input, index) => {

        input.addEventListener(
            "input",
            () => {

                input.value =
                    input.value.replace(
                        /\D/g,
                        ""
                    );

                if (
                    input.value &&
                    index <
                    otpInputs.length - 1
                ) {

                    otpInputs[
                        index + 1
                    ].focus();
                }
            }
        );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Backspace" &&
                    !input.value &&
                    index > 0
                ) {

                    otpInputs[
                        index - 1
                    ].focus();
                }
            }
        );
    }
);


// ============================================================
// VERIFY OTP
// ============================================================

verifyBtn?.addEventListener(
    "click",
    async () => {

        const otp =
            [...otpInputs]
                .map(input => input.value)
                .join("");

        if (otp.length !== 6) {

            message(
                otpMessage,
                "Please enter the complete 6-digit code.",
                "error"
            );

            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.textContent = "Verifying...";

        try {

            await api(
                "/api/auth/verify-otp",
                {
                    method: "POST",

                    body: JSON.stringify({
                        email: currentEmail,
                        otp,
                        verificationToken
                    })
                }
            );

            hide(otpScreen);
            show(dashboardScreen);

            updateDashboardDate();

            await loadDashboard();

        } catch (error) {

            message(
                otpMessage,
                error.message,
                "error"
            );

        } finally {

            verifyBtn.disabled = false;
            verifyBtn.textContent =
                "Verify & Login";
        }
    }
);


// ============================================================
// LOGOUT
// ============================================================

logoutBtn?.addEventListener(
    "click",
    () => {

        currentEmail = "";
        verificationToken = "";

        hide(dashboardScreen);
        hide(otpScreen);
        show(loginScreen);

        if (emailInput) {
            emailInput.value = "";
        }

        otpInputs.forEach(
            input => {
                input.value = "";
            }
        );
    }
);


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        const data =
            await api("/api/dashboard");

        updateDashboard(data);

        updateDashboardDate();

        showDashboard();

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


function updateDashboard(data) {

    const stats =
        data.stats || {};

    const users =
        data.userOverview || {};

    const homes =
        data.homeOnboarding || {};

    const attention =
        data.attentionRequired || {};


    setText(
        "totalUsers",
        number(stats.totalUsers)
    );

    setText(
        "activeUsers",
        number(stats.activeUsers)
    );

    setText(
        "totalHomes",
        number(stats.totalHomes)
    );

    setText(
        "pendingAccess",
        number(stats.pendingAccess)
    );


    setText(
        "overviewTotalUsers",
        number(users.total)
    );

    setText(
        "overviewActiveUsers",
        number(users.active)
    );

    setText(
        "overviewPendingUsers",
        number(users.pending)
    );

    setText(
        "overviewSuspendedUsers",
        number(users.suspended)
    );


    updateUserChart(users);


    const progress =
        homes.progress || 0;

    setText(
        "onboardingProgress",
        `${progress}%`
    );

    setText(
        "fullyOnboarded",
        number(homes.fullyOnboarded)
    );

    setText(
        "homesInProgress",
        number(homes.inProgress)
    );

    setText(
        "homesNeedsAttention",
        number(homes.needsAttention)
    );


    const progressBar =
        document.getElementById(
            "onboardingProgressBar"
        );

    if (progressBar) {
        progressBar.style.width =
            `${progress}%`;
    }


    setText(
        "attentionPendingAccess",
        number(attention.pendingAccess)
    );

    setText(
        "attentionHomesNeedsAttention",
        number(
            attention.homesNeedsAttention
        )
    );

    setText(
        "attentionSlaBreached",
        number(
            attention.slaBreachedComplaints
        )
    );

    setText(
        "attentionGateApprovals",
        number(
            attention.pendingGateApprovals
        )
    );

    setText(
        "attentionVendorContracts",
        number(
            attention.vendorContractsDue
        )
    );


    renderActivity(
        data.recentActivity || []
    );
}


// ============================================================
// USER CHART
// ============================================================

function updateUserChart(users) {

    const chart =
        document.getElementById(
            "userOverviewChart"
        );

    if (!chart) return;

    const total =
        Number(users.total || 0);

    const active =
        Number(users.active || 0);

    const pending =
        Number(users.pending || 0);

    if (!total) {

        chart.style.background =
            "conic-gradient(#e5e5eb 0 360deg)";

        return;
    }

    const activeDegrees =
        active / total * 360;

    const pendingDegrees =
        pending / total * 360;

    chart.style.background =
        `conic-gradient(
            #6c4cff 0deg ${activeDegrees}deg,
            #b894ff ${activeDegrees}deg
            ${activeDegrees + pendingDegrees}deg,
            #d6d5dd
            ${activeDegrees + pendingDegrees}deg
            360deg
        )`;
}


// ============================================================
// ACTIVITY
// ============================================================

function renderActivity(activities) {

    const container =
        document.getElementById(
            "recentActivity"
        );

    if (!container) return;

    if (!activities.length) {

        container.innerHTML = `
            <div class="empty-activity">
                No recent activity.
            </div>
        `;

        return;
    }

    container.innerHTML =
        activities
            .map(
                item => `
                    <div class="activity-item">

                        <div class="activity-icon">
                            •
                        </div>

                        <div>

                            <strong>
                                ${escapeHtml(
                                    item.action
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    item.description
                                )}
                            </span>

                        </div>

                    </div>
                `
            )
            .join("");
}


// ============================================================
// DASHBOARD / MODULE VIEW
// ============================================================

function showDashboard() {

    show(dashboardContent);
    hide(moduleContent);

    document
        .querySelectorAll("[data-module]")
        .forEach(button => {
            button.classList.remove("active");
        });

    const dashboardButton =
        document.querySelector(
            '[data-module="dashboard"]'
        );

    dashboardButton?.classList.add("active");
}


// ============================================================
// SIDEBAR
// ============================================================

document
    .querySelectorAll("[data-module]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const module =
                    button.dataset.module;

                setActiveModule(module);

                if (
                    module === "dashboard"
                ) {

                    showDashboard();
                    loadDashboard();

                } else {

                    showModule(module);
                }
            }
        );
    });


function setActiveModule(module) {

    document
        .querySelectorAll("[data-module]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.module === module
            );
        });
}


// ============================================================
// MODULE ROUTER
// ============================================================

async function showModule(module) {

    hide(dashboardContent);
    show(moduleContent);

    if (module === "community") {
        await renderCommunityConfiguration();
        return;
    }

    if (module === "users") {
        await renderUsersHomes();
        return;
    }

    if (module === "roles") {
        await renderCreateRole();
        return;
    }

    const modules = {

        access: [
            "Access Control",
            "Manage user access and approvals."
        ],

        audit: [
            "Audit Logs",
            "Review recent system activity."
        ],

        alerts: [
            "Alerts",
            "View and manage community alerts."
        ],

        settings: [
            "System Settings",
            "Manage CommunityERP system settings."
        ],

        support: [
            "Support",
            "Get help with CommunityERP."
        ]
    };

    const content =
        modules[module] || [
            "Module",
            "Module information."
        ];

    moduleContent.innerHTML = `
        <div class="module-placeholder">

            <h2>
                ${escapeHtml(content[0])}
            </h2>

            <p>
                ${escapeHtml(content[1])}
            </p>

        </div>
    `;
}


// ============================================================
// QUICK ACTIONS
// ============================================================

newActionBtn?.addEventListener(
    "click",
    () => {
        show(
            quickActionsModal
        );
    }
);


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".quick-action-card[data-action]"
            );

        if (!button) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const action =
            button.dataset.action;

        hide(
            quickActionsModal
        );

        handleAction(
            action
        );
    }
);


// ============================================================
// QUICK ACTION FORMS
// ============================================================

const actionForms = {

    role: {

        title: "Create New Role",

        endpoint: "/api/roles",

        fields: `
            <div class="form-group">

                <label>
                    Role Name
                </label>

                <input
                    name="name"
                    placeholder="Enter role name"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Description
                </label>

                <textarea
                    name="description"
                    placeholder="Describe the role"
                ></textarea>

            </div>
        `,

        button: "Create Role"
    },


    household: {

        title: "Add Household",

        endpoint: "/api/homes",

        fields: `
            <div class="form-group">

                <label>
                    Household Name
                </label>

                <input
                    name="name"
                    placeholder="Enter household name"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Unit
                </label>

                <input
                    name="unit"
                    placeholder="Example: A-101"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Onboarding Status
                </label>

                <select name="status">

                    <option value="In Progress">
                        In Progress
                    </option>

                    <option value="Onboarded">
                        Onboarded
                    </option>

                    <option value="Needs Attention">
                        Needs Attention
                    </option>

                </select>

            </div>
        `,

        button: "Create Household"
    },


    policy: {

        title: "Update Policy",

        endpoint: "/api/policies",

        fields: `
            <div class="form-group">

                <label>
                    Policy Title
                </label>

                <input
                    name="title"
                    placeholder="Enter policy title"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Description
                </label>

                <textarea
                    name="description"
                    placeholder="Enter policy details"
                ></textarea>

            </div>
        `,

        button: "Update Policy"
    },


    module: {

        title: "Configure Module",

        endpoint: "/api/modules",

        fields: `
            <div class="form-group">

                <label>
                    Module Name
                </label>

                <input
                    name="name"
                    placeholder="Enter module name"
                    required
                >

            </div>


            <div class="form-group">

                <label>
                    Status
                </label>

                <select name="enabled">

                    <option value="true">
                        Enabled
                    </option>

                    <option value="false">
                        Disabled
                    </option>

                </select>

            </div>
        `,

        button: "Save Configuration"
    }

};


// ============================================================
// HANDLE QUICK ACTION
// ============================================================

function handleAction(action) {

    if (action === "add-user") {

        show(
            addUserModal
        );

        return;
    }


    if (action === "announcement") {

        show(
            announcementModal
        );

        return;
    }


    if (actionForms[action]) {

        openActionForm(
            actionForms[action]
        );

        return;
    }

}


// ============================================================
// OPEN GENERIC ACTION FORM
// ============================================================

function openActionForm(config) {

    const modal =
        document.getElementById(
            "genericActionModal"
        );

    const body =
        document.getElementById(
            "genericActionBody"
        );

    if (!modal || !body) {
        return;
    }

    body.innerHTML = `

        <form
            id="dynamicActionForm"
            class="modal-form"
        >

            <div
                style="
                    padding: 25px 28px 10px;
                "
            >

                <h2>
                    ${escapeHtml(
                        config.title
                    )}
                </h2>

                <p>
                    Complete the details below.
                </p>

            </div>


            <div
                style="
                    padding: 10px 28px 25px;
                "
            >

                ${config.fields}

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    data-close-modal="genericActionModal"
                >
                    Cancel
                </button>


                <button
                    type="submit"
                    class="primary-btn"
                >
                    ${escapeHtml(
                        config.button
                    )}
                </button>

            </div>

        </form>

    `;


    show(
        modal
    );


    const form =
        document.getElementById(
            "dynamicActionForm"
        );


    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const formData =
                new FormData(form);


            const payload = {};


            formData.forEach(
                (value, key) => {

                    payload[key] =
                        value;

                }
            );


            if (
                config.endpoint ===
                "/api/modules"
            ) {

                payload.enabled =
                    payload.enabled ===
                    "true";

            }


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Saving...";

            }


            try {

                const result =
                    await api(
                        config.endpoint,
                        {
                            method: "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                alert(
                    result.message ||
                    "Saved successfully."
                );


                hide(
                    modal
                );


                await loadDashboard();


            } catch (error) {

                alert(
                    error.message
                );


            } finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        config.button;

                }

            }

        }
    );

}
// ============================================================
// SUBMIT GENERIC ACTION FORM
// ============================================================

async function submitActionForm(
    event,
    form,
    config
) {

    event.preventDefault();


    const formData =
        new FormData(form);


    const payload =
        Object.fromEntries(
            formData.entries()
        );


    if (
        payload.enabled === "true" ||
        payload.enabled === "false"
    ) {

        payload.enabled =
            payload.enabled === "true";

    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        const result =
            await api(
                config.endpoint,
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        alert(
            result.message
        );


        hide(
            genericActionModal
        );


        await loadDashboard();


    } catch (error) {

        alert(
            error.message
        );


    } finally {

        button.disabled = false;

        button.textContent =
            config.button;

    }

}
// ============================================================
// CLOSE MODALS
// ============================================================

document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const modalId =
                    button.dataset.closeModal;

                const modal =
                    document.getElementById(
                        modalId
                    );

                hide(modal);
            }
        );
    });


document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            () => {

                const modal =
                    overlay.closest(".modal");

                hide(modal);
            }
        );
    });


// ============================================================
// ADD USER
// ============================================================

document
    .getElementById("addUserForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const form =
                event.currentTarget;

            const formData =
                new FormData(form);

            const payload = {};

            formData.forEach(
                (value, key) => {
                    payload[key] = value;
                }
            );

            try {

                const result =
                    await api(
                        "/api/users",
                        {
                            method: "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                alert(
                    result.message ||
                    "User created successfully."
                );

                form.reset();

                hide(addUserModal);

                await loadDashboard();

            } catch (error) {

                alert(
                    error.message
                );
            }
        }
    );


// ============================================================
// ANNOUNCEMENT
// ============================================================

document
    .getElementById("announcementForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const form =
                event.currentTarget;

            const formData =
                new FormData(form);

            const payload = {};

            formData.forEach(
                (value, key) => {

                    if (
                        key !== "attachments"
                    ) {

                        if (
                            key === "inAppNotice" ||
                            key === "pushNotification" ||
                            key === "emailBroadcast"
                        ) {

                            payload[key] =
                                true;

                        } else {

                            payload[key] =
                                value;
                        }
                    }
                }
            );


            payload.inAppNotice =
                form.querySelector(
                    '[name="inAppNotice"]'
                )?.checked || false;

            payload.pushNotification =
                form.querySelector(
                    '[name="pushNotification"]'
                )?.checked || false;

            payload.emailBroadcast =
                form.querySelector(
                    '[name="emailBroadcast"]'
                )?.checked || false;


            try {

                const result =
                    await api(
                        "/api/announcements",
                        {
                            method: "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                alert(
                    result.message ||
                    "Announcement created successfully."
                );

                form.reset();

                hide(
                    announcementModal
                );

                await loadDashboard();

            } catch (error) {

                alert(
                    error.message
                );
            }
        }
    );


// ============================================================
// COMMUNITY CONFIGURATION
// ============================================================

async function renderCommunityConfiguration() {

    moduleContent.innerHTML = `

        <div class="new-module-page">

            <div class="module-page-header">

                <div>

                    <div class="breadcrumb">
                        Community Configuration
                    </div>

                    <h1>
                        Community Configuration
                    </h1>

                    <p>
                        Configure community information,
                        access, complaints and billing.
                    </p>

                </div>

                <div class="module-header-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelCommunityConfig"
                    >
                        Cancel Changes
                    </button>

                    <button
                        type="button"
                        class="primary-btn"
                        id="saveCommunityConfiguration"
                    >
                        Save Configuration
                    </button>

                </div>

            </div>


            <div
                id="communityConfigStatus"
                class="module-status"
            ></div>


            <div class="config-page-grid">

                <div>

                    <div class="config-card">

                        <div class="config-card-header">

                            <h2>
                                Community Information
                            </h2>

                        </div>

                        <div
                            id="communityInformation"
                        ></div>

                    </div>


                    <div class="config-card">

                        <div class="config-card-header">

                            <h2>
                                Access & Household Settings
                            </h2>

                        </div>

                        <div
                            id="communityAccess"
                        ></div>

                    </div>


                    <div class="config-card">

                        <div class="config-card-header">

                            <h2>
                                Recent Configuration Changes
                            </h2>

                        </div>

                        <div
                            id="configurationActivity"
                        ></div>

                    </div>

                </div>


                <div>

                    <div class="config-card">

                        <div class="config-card-header">

                            <h2>
                                Complaint & SLA Settings
                            </h2>

                        </div>

                        <div
                            id="communitySla"
                        ></div>

                    </div>


                    <div class="config-card">

                        <div class="config-card-header">

                            <h2>
                                Billing & Dues Settings
                            </h2>

                        </div>

                        <div
                            id="communityBilling"
                        ></div>

                    </div>

                </div>

            </div>

        </div>
    `;


    try {

        const [
            config,
            schema
        ] = await Promise.all([

            api(
                "/api/community/config"
            ),

            api(
                "/api/community/config-schema"
            )

        ]);


        renderCommunityFields(
            config,
            schema
        );


        await loadConfigurationActivity();


        document
            .getElementById(
                "saveCommunityConfiguration"
            )
            ?.addEventListener(
                "click",
                saveCommunityConfig
            );


        document
            .getElementById(
                "cancelCommunityConfig"
            )
            ?.addEventListener(
                "click",
                () => {
                    renderCommunityConfiguration();
                }
            );

    } catch (error) {

        setStatus(
            "communityConfigStatus",
            error.message,
            "error"
        );
    }
}


// ============================================================
// CONFIG INPUT
// ============================================================

function renderConfigInput(
    field,
    value
) {

    if (field.type === "select") {

        return `

            <div class="config-field">

                <label>
                    ${escapeHtml(field.label)}
                </label>

                <select
                    data-config-key="${escapeHtml(
                        field.key
                    )}"
                >

                    ${(field.options || [])
                        .map(
                            option => `

                                <option
                                    value="${escapeHtml(option)}"
                                    ${
                                        String(value) ===
                                        String(option)
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHtml(option)}
                                </option>

                            `
                        )
                        .join("")}

                </select>

            </div>

        `;
    }


    return `

        <div class="config-field">

            <label>
                ${escapeHtml(field.label)}
            </label>

            <input
                type="${escapeHtml(
                    field.type || "text"
                )}"
                value="${escapeHtml(
                    value ?? ""
                )}"
                data-config-key="${escapeHtml(
                    field.key
                )}"
            >

        </div>

    `;
}


// ============================================================
// CONFIG TOGGLE
// ============================================================

function renderConfigToggle(
    field,
    checked
) {

    return `

        <div class="config-toggle-row">

            <div>

                <strong>
                    ${escapeHtml(field.label)}
                </strong>

                <p>
                    ${escapeHtml(
                        field.description || ""
                    )}
                </p>

            </div>

            <label class="erp-switch">

                <input
                    type="checkbox"
                    data-config-key="${escapeHtml(
                        field.key
                    )}"
                    ${
                        checked
                            ? "checked"
                            : ""
                    }
                >

                <span class="erp-slider"></span>

            </label>

        </div>

    `;
}


// ============================================================
// RENDER CONFIGURATION
// ============================================================

function renderCommunityFields(
    config,
    schema
) {

    const information =
        document.getElementById(
            "communityInformation"
        );

    const access =
        document.getElementById(
            "communityAccess"
        );

    const sla =
        document.getElementById(
            "communitySla"
        );

    const billing =
        document.getElementById(
            "communityBilling"
        );


    if (information) {

        information.innerHTML =
            (schema.information || [])
                .map(
                    field =>
                        renderConfigInput(
                            field,
                            config[field.key]
                        )
                )
                .join("");
    }


    if (access) {

        access.innerHTML =
            [
                ...(schema.age || []),
                ...(schema.access || [])
            ]
                .map(
                    field => {

                        if (
                            !field.type
                        ) {

                            return renderConfigToggle(
                                field,
                                Boolean(
                                    config[field.key]
                                )
                            );
                        }

                        return renderConfigInput(
                            field,
                            config[field.key]
                        );
                    }
                )
                .join("");
    }


    if (sla) {

        sla.innerHTML =
            [
                ...(schema.sla || []),
                ...(schema.complaintToggles || [])
            ]
                .map(
                    field => {

                        if (
                            !field.type
                        ) {

                            return renderConfigToggle(
                                field,
                                Boolean(
                                    config[field.key]
                                )
                            );
                        }

                        return renderConfigInput(
                            field,
                            config[field.key]
                        );
                    }
                )
                .join("");
    }


    if (billing) {

        billing.innerHTML =
            [
                ...(schema.billing || []),
                ...(schema.billingToggles || [])
            ]
                .map(
                    field => {

                        if (
                            !field.type
                        ) {

                            return renderConfigToggle(
                                field,
                                Boolean(
                                    config[field.key]
                                )
                            );
                        }

                        return renderConfigInput(
                            field,
                            config[field.key]
                        );
                    }
                )
                .join("");
    }
}


// ============================================================
// CONFIG ACTIVITY
// ============================================================

async function loadConfigurationActivity() {

    const container =
        document.getElementById(
            "configurationActivity"
        );

    if (!container) return;

    try {

        const activities =
            await api(
                "/api/community/config/activity"
            );


        if (!activities.length) {

            container.innerHTML = `
                <p>
                    No configuration changes yet.
                </p>
            `;

            return;
        }


        container.innerHTML =
            activities
                .map(
                    item => `

                        <div class="activity-item">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        item.action
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        item.description
                                    )}
                                </span>

                            </div>

                        </div>

                    `
                )
                .join("");

    } catch (error) {

        container.innerHTML = `
            <p>
                ${escapeHtml(
                    error.message
                )}
            </p>
        `;
    }
}


// ============================================================
// SAVE COMMUNITY CONFIGURATION
// ============================================================

async function saveCommunityConfig() {

    const payload = {};


    document
        .querySelectorAll(
            "[data-config-key]"
        )
        .forEach(element => {

            const key =
                element.dataset.configKey;

            if (
                element.type === "checkbox"
            ) {

                payload[key] =
                    element.checked;

            } else {

                payload[key] =
                    element.value;
            }
        });


    const button =
        document.getElementById(
            "saveCommunityConfiguration"
        );


    if (button) {

        button.disabled = true;
        button.textContent = "Saving...";
    }


    try {

        const result =
            await api(
                "/api/community/config",
                {
                    method: "PUT",

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        setStatus(
            "communityConfigStatus",
            result.message,
            "success"
        );


        await loadConfigurationActivity();

    } catch (error) {

        setStatus(
            "communityConfigStatus",
            error.message,
            "error"
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Save Configuration";
        }
    }
}


// ============================================================
// USERS & HOMES
// ============================================================

async function renderUsersHomes() {

    moduleContent.innerHTML = `

        <div class="new-module-page">

            <div class="module-page-header">

                <div>

                    <div class="breadcrumb">
                        Users & Homes
                    </div>

                    <h1>
                        Users & Homes
                    </h1>

                    <p>
                        Manage residents, owners and households.
                    </p>

                </div>

                <div class="module-header-actions">

                    <button
                        type="button"
                        class="primary-btn"
                        id="addHouseholdFromHomes"
                    >
                        Add New Household
                    </button>

                </div>

            </div>


            <div id="homeStats"></div>


            <div class="config-card">

                <div class="config-card-header">

                    <h2>
                        Household Directory
                    </h2>

                </div>

                <div id="homeTable"></div>

            </div>

        </div>
    `;


    try {

        const [
            homes,
            users
        ] = await Promise.all([

            api("/api/homes"),

            api("/api/users")

        ]);


        renderHomeStats(
            homes,
            users
        );


        renderHomeTable({
            homes,
            users
        });


        document
            .getElementById(
                "addHouseholdFromHomes"
            )
            ?.addEventListener(
                "click",
                () => openHouseholdForm()
            );

    } catch (error) {

        moduleContent.innerHTML += `
            <div class="module-status error">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}


// ============================================================
// HOME STATS
// ============================================================

function renderHomeStats(
    homes,
    users
) {

    const container =
        document.getElementById(
            "homeStats"
        );

    if (!container) return;

    const totalHomes =
        homes.length;

    const owners =
        users.filter(
            user =>
                user.role === "Owner"
        ).length;

    const residents =
        users.filter(
            user =>
                user.role === "Resident"
        ).length;

    const occupied =
        homes.filter(
            home =>
                home.status !== "Vacant"
        ).length;

    const vacant =
        Math.max(
            totalHomes - occupied,
            0
        );


    container.innerHTML = `

        <div class="home-stat-grid">

            ${homeStat(
                "Total Residents",
                residents,
                "Current residents",
                "residents"
            )}

            ${homeStat(
                "Total Owners",
                owners,
                "Registered owners",
                "owners"
            )}

            ${homeStat(
                "Occupied Homes",
                occupied,
                "Homes with occupancy",
                "occupied"
            )}

            ${homeStat(
                "Vacant Units",
                vacant,
                "Available units",
                "vacant"
            )}

        </div>
    `;
}


function homeStat(
    title,
    value,
    note,
    type
) {

    return `

        <div class="home-stat-card ${escapeHtml(type)}">

            <span>
                ${escapeHtml(title)}
            </span>

            <strong>
                ${number(value)}
            </strong>

            <small>
                ${escapeHtml(note)}
            </small>

        </div>
    `;
}


// ============================================================
// HOME TABLE
// ============================================================

function renderHomeTable(state) {

    const container =
        document.getElementById(
            "homeTable"
        );

    if (!container) return;

    const homes =
        state.homes || [];

    const users =
        state.users || [];


    if (!homes.length) {

        container.innerHTML = `
            <div class="empty-activity">
                No households found.
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>

                        <th>
                            Home ID
                        </th>

                        <th>
                            Primary Member
                        </th>

                        <th>
                            Member Type
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${homes
                        .map(
                            home => {

                                const member =
                                    users.find(
                                        user =>
                                            user.residence ===
                                            home.unit
                                    );

                                const memberName =
                                    member
                                        ? `${member.firstName} ${member.lastName}`
                                        : home.name || "—";

                                const memberType =
                                    member?.role ||
                                    home.memberType ||
                                    "—";

                                return `

                                    <tr>

                                        <td>
                                            ${escapeHtml(
                                                home.unit ||
                                                home.id
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHtml(
                                                memberName
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHtml(
                                                memberType
                                            )}
                                        </td>

                                        <td>

                                            <span
                                                class="status-badge ${statusClass(
                                                    home.status
                                                )}"
                                            >
                                                ${escapeHtml(
                                                    home.status ||
                                                    "—"
                                                )}
                                            </span>

                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                class="secondary-btn"
                                                data-view-home="${escapeHtml(
                                                    home.id
                                                )}"
                                            >
                                                View
                                            </button>

                                            <button
                                                type="button"
                                                class="secondary-btn"
                                                data-edit-home="${escapeHtml(
                                                    home.id
                                                )}"
                                            >
                                                Edit
                                            </button>

                                        </td>

                                    </tr>
                                `;
                            }
                        )
                        .join("")}

                </tbody>

            </table>

        </div>
    `;


    container
        .querySelectorAll(
            "[data-view-home]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        viewHousehold(
                            button.dataset.viewHome,
                            homes
                        )
                );
            }
        );


    container
        .querySelectorAll(
            "[data-edit-home]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        editHousehold(
                            button.dataset.editHome,
                            homes
                        )
                );
            }
        );
}


// ============================================================
// HOUSEHOLD FORM
// ============================================================

function openHouseholdForm(
    home = null
) {

    const existing =
        document.getElementById(
            "householdDynamicForm"
        );

    existing?.remove();


    const modal =
        document.createElement("div");

    modal.id =
        "householdDynamicForm";

    modal.className =
        "modal";


    modal.innerHTML = `

        <div class="modal-overlay"></div>

        <div class="modal-box form-modal">

            <div class="modal-header">

                <div>

                    <h2>
                        ${
                            home
                                ? "Edit Household"
                                : "Add Household"
                        }
                    </h2>

                </div>

                <button
                    type="button"
                    class="modal-close"
                    id="closeHouseholdForm"
                >
                    ×
                </button>

            </div>

            <form
                id="householdForm"
                class="modal-form"
            >

                <div class="form-group">

                    <label>
                        Household Name
                    </label>

                    <input
                        name="name"
                        required
                        value="${escapeHtml(
                            home?.name || ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Unit
                    </label>

                    <input
                        name="unit"
                        required
                        value="${escapeHtml(
                            home?.unit || ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Member Type
                    </label>

                    <input
                        name="memberType"
                        value="${escapeHtml(
                            home?.memberType || ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Status
                    </label>

                    <select name="status">

                        <option
                            value="In Progress"
                            ${
                                home?.status ===
                                "In Progress"
                                    ? "selected"
                                    : ""
                            }
                        >
                            In Progress
                        </option>

                        <option
                            value="Onboarded"
                            ${
                                home?.status ===
                                "Onboarded"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Onboarded
                        </option>

                        <option
                            value="Needs Attention"
                            ${
                                home?.status ===
                                "Needs Attention"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Needs Attention
                        </option>

                    </select>

                </div>

                <div class="form-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelHouseholdForm"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        ${
                            home
                                ? "Save Changes"
                                : "Create Household"
                        }
                    </button>

                </div>

            </form>

        </div>
    `;


    document.body.appendChild(modal);

    show(modal);


    document
        .getElementById(
            "closeHouseholdForm"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );


    document
        .getElementById(
            "cancelHouseholdForm"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );


    document
        .getElementById(
            "householdForm"
        )
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const form =
                    event.currentTarget;

                const formData =
                    new FormData(form);

                const payload = {};

                formData.forEach(
                    (value, key) => {
                        payload[key] = value;
                    }
                );


                try {

                    const url =
                        home
                            ? `/api/homes/${encodeURIComponent(
                                home.id
                            )}`
                            : "/api/homes";

                    const method =
                        home
                            ? "PUT"
                            : "POST";


                    const result =
                        await api(
                            url,
                            {
                                method,
                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );


                    alert(
                        result.message ||
                        "Household saved successfully."
                    );


                    modal.remove();

                    await renderUsersHomes();

                } catch (error) {

                    alert(
                        error.message
                    );
                }
            }
        );
}


// ============================================================
// VIEW HOUSEHOLD
// ============================================================

function viewHousehold(
    id,
    homes
) {

    const home =
        homes.find(
            item => item.id === id
        );

    if (!home) return;

    alert(
        [
            `Household: ${home.name || ""}`,
            `Unit: ${home.unit || ""}`,
            `Member Type: ${home.memberType || ""}`,
            `Status: ${home.status || ""}`
        ].join("\n")
    );
}


// ============================================================
// EDIT HOUSEHOLD
// ============================================================

function editHousehold(
    id,
    homes
) {

    const home =
        homes.find(
            item => item.id === id
        );

    if (!home) return;

    openHouseholdForm(home);
}


// ============================================================
// STATUS
// ============================================================

function statusClass(status) {

    return String(
        status || ""
    )
        .toLowerCase()
        .replaceAll(" ", "-");
}


// ============================================================
// ROLES & PERMISSIONS
// ============================================================

async function renderCreateRole() {

    moduleContent.innerHTML = `

        <div class="new-module-page role-page">

            <div class="module-page-header">

                <div>

                    <div class="breadcrumb">
                        Roles & Permissions › Create New Role
                    </div>

                    <h1>
                        Create New Role
                    </h1>

                    <p>
                        Define role identity and configure
                        granular module access permissions.
                    </p>

                </div>

                <div class="module-header-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        id="cancelRole"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        class="primary-btn"
                        id="saveRole"
                    >
                        Save Role
                    </button>

                </div>

            </div>


            <div
                id="roleStatus"
                class="module-status"
            ></div>


            <div class="role-card">

                <div class="role-card-header">

                    <span>
                        ♙
                    </span>

                    <div>

                        <h2>
                            Role Identity
                        </h2>

                    </div>

                </div>

                <div
                    class="role-identity-grid"
                    id="roleIdentityFields"
                ></div>

            </div>


            <div class="role-card permission-card">

                <div class="permission-heading">

                    <div>

                        <h2>
                            Permission Configuration
                        </h2>

                        <p>
                            Configure detailed access levels
                            across system modules.
                        </p>

                    </div>

                    <button
                        type="button"
                        class="grant-all-btn"
                        id="grantAllPermissions"
                    >
                        Grant All Permissions
                    </button>

                </div>

                <div
                    id="permissionModules"
                ></div>

            </div>

        </div>
    `;


    try {

        const schema =
            await api(
                "/api/roles/schema"
            );

        renderRoleSchema(schema);


        document
            .getElementById(
                "grantAllPermissions"
            )
            ?.addEventListener(
                "click",
                grantAllPermissions
            );


        document
            .getElementById(
                "saveRole"
            )
            ?.addEventListener(
                "click",
                saveRole
            );


        document
            .getElementById(
                "cancelRole"
            )
            ?.addEventListener(
                "click",
                () => {
                    showDashboard();
                    loadDashboard();
                }
            );


        document
            .querySelectorAll(
                ".permission-module-toggle"
            )
            .forEach(
                toggle => {

                    toggle.addEventListener(
                        "change",
                        () => {

                            const container =
                                toggle.closest(
                                    ".permission-module"
                                );

                            container
                                ?.querySelectorAll(
                                    ".permission-check"
                                )
                                .forEach(
                                    check => {

                                        check.disabled =
                                            !toggle.checked;

                                        if (
                                            !toggle.checked
                                        ) {

                                            check.checked =
                                                false;
                                        }
                                    }
                                );
                        }
                    );
                }
            );

    } catch (error) {

        setStatus(
            "roleStatus",
            error.message,
            "error"
        );
    }
}


// ============================================================
// ROLE SCHEMA
// ============================================================

function renderRoleSchema(
    schema
) {

    const identity =
        schema.identity || {};


    const identityContainer =
        document.getElementById(
            "roleIdentityFields"
        );


    const modulesContainer =
        document.getElementById(
            "permissionModules"
        );


    if (identityContainer) {

        identityContainer.innerHTML = `

            <div class="config-field">

                <label>
                    ${escapeHtml(
                        identity.nameLabel ||
                        "Role Name"
                    )}
                    <b>*</b>
                </label>

                <input
                    id="roleName"
                    placeholder="${escapeHtml(
                        identity.namePlaceholder ||
                        ""
                    )}"
                >

            </div>


            <div class="config-field">

                <label>
                    ${escapeHtml(
                        identity.descriptionLabel ||
                        "Description"
                    )}
                </label>

                <textarea
                    id="roleDescription"
                    placeholder="${escapeHtml(
                        identity.descriptionPlaceholder ||
                        ""
                    )}"
                ></textarea>

            </div>


            <div class="config-field">

                <label>
                    ${escapeHtml(
                        identity.templateLabel ||
                        "Base Template"
                    )}
                </label>

                <select id="roleTemplate">

                    ${(schema.templates || [])
                        .map(
                            template => `

                                <option
                                    value="${escapeHtml(
                                        template.value
                                    )}"
                                >
                                    ${escapeHtml(
                                        template.label
                                    )}
                                </option>

                            `
                        )
                        .join("")}

                </select>

            </div>

        `;
    }


    if (modulesContainer) {

        modulesContainer.innerHTML =
            (schema.modules || [])
                .map(
                    permissionModuleHtml
                )
                .join("");
    }
}


// ============================================================
// PERMISSION MODULE
// ============================================================

function permissionModuleHtml(
    module
) {

    return `

        <div class="permission-module">

            <div class="permission-module-header">

                <div class="permission-title">

                    <span class="permission-icon">
                        ${escapeHtml(
                            module.icon || "▣"
                        )}
                    </span>

                    <div>

                        <h3>
                            ${escapeHtml(
                                module.name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                module.description ||
                                ""
                            )}
                        </p>

                    </div>

                </div>


                <label class="erp-switch">

                    <input
                        type="checkbox"
                        class="permission-module-toggle"
                        data-module="${escapeHtml(
                            module.key
                        )}"
                        ${
                            module.defaultEnabled
                                ? "checked"
                                : ""
                        }
                    >

                    <span class="erp-slider"></span>

                </label>

            </div>


            <div class="permission-list">

                ${(module.permissions || [])
                    .map(
                        permission => `

                            <label class="permission-item">

                                <input
                                    type="checkbox"
                                    class="permission-check"
                                    data-module="${escapeHtml(
                                        module.key
                                    )}"
                                    data-permission="${escapeHtml(
                                        permission.key
                                    )}"
                                    ${
                                        permission.defaultEnabled
                                            ? "checked"
                                            : ""
                                    }
                                >

                                <span>
                                    ${escapeHtml(
                                        permission.label ||
                                        permission.name ||
                                        permission.key
                                    )}
                                </span>

                            </label>

                        `
                    )
                    .join("")}

            </div>

        </div>

    `;
}