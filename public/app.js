// =====================================================
// ELEMENTS
// =====================================================

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


// =====================================================
// AUTH
// =====================================================

let currentEmail = "";
let verificationToken = "";


// =====================================================
// HELPERS
// =====================================================

function show(element) {
    element?.classList.remove("hidden");
}


function hide(element) {
    element?.classList.add("hidden");
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function number(value) {

    return Number(value || 0)
        .toLocaleString();

}


function message(element, text, type = "") {

    if (!element) return;

    element.textContent = text;
    element.className =
        `message ${type}`;

}


async function api(url, options = {}) {

    const response =
        await fetch(url, {

            ...options,

            headers: {

                "Content-Type":
                    "application/json",

                ...(options.headers || {})

            }

        });


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Something went wrong."
        );

    }


    return data;

}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// CURRENT DATE
// =====================================================

function updateDashboardDate() {

    const element =
        document.getElementById(
            "dashboardDate"
        );


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


// =====================================================
// LOGIN
// =====================================================

generateBtn?.addEventListener(
    "click",
    async () => {

        const email =
            emailInput.value.trim();


        if (!email) {

            message(
                loginMessage,
                "Please enter your email address.",
                "error"
            );

            return;
        }


        generateBtn.disabled = true;
        generateBtn.textContent =
            "Sending...";


        try {

            const data =
                await api(
                    "/api/auth/generate-otp",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                email
                            })
                    }
                );


            currentEmail = email;

            verificationToken =
                data.verificationToken;


            hide(loginScreen);
            show(otpScreen);


            message(
                otpMessage,
                data.message,
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


// =====================================================
// OTP INPUT
// =====================================================

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


// =====================================================
// VERIFY OTP
// =====================================================

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
        verifyBtn.textContent =
            "Verifying...";


        try {

            await api(
                "/api/auth/verify-otp",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            email:
                                currentEmail,

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


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        const data =
            await api(
                "/api/dashboard"
            );


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


    // Stats

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


    // User overview

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


    // Homes

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


    // Attention

    setText(
        "attentionPendingAccess",
        number(
            attention.pendingAccess
        )
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


// =====================================================
// USER CHART
// =====================================================

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


// =====================================================
// ACTIVITY
// =====================================================

function renderActivity(activities) {

    const container =
        document.getElementById(
            "recentActivity"
        );


    if (!container) return;


    if (!activities.length) {

        container.innerHTML =
            `
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


// =====================================================
// DASHBOARD VIEW
// =====================================================

function showDashboard() {

    show(dashboardContent);

    hide(moduleContent);

}


// =====================================================
// SIDEBAR
// =====================================================

document
    .querySelectorAll("[data-module]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const module =
                    button.dataset.module;


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


function showModule(module) {

    hide(dashboardContent);

    show(moduleContent);


    const modules = {

        community: [
            "Community Configuration",
            "Configure community settings and platform information."
        ],

        users: [
            "Users & Homes",
            "Manage community users and households."
        ],

        roles: [
            "Roles & Permissions",
            "Manage roles and permissions."
        ],

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
        modules[module] ||
        [
            "Module",
            "Module information."
        ];


    moduleContent.innerHTML = `

        <div class="module-placeholder">

            <h2>
                ${content[0]}
            </h2>

            <p>
                ${content[1]}
            </p>

        </div>

    `;

}


// =====================================================
// QUICK ACTIONS
// =====================================================

newActionBtn?.addEventListener(
    "click",
    () => {

        show(
            quickActionsModal
        );

    }
);


document
    .querySelectorAll("[data-action]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                hide(
                    quickActionsModal
                );


                handleAction(
                    button.dataset.action
                );

            }
        );

    });


// =====================================================
// REUSABLE QUICK ACTION FORMS
// =====================================================

const actionForms = {

    role: {

        title: "Create New Role",

        endpoint: "/api/roles",

        fields: `

            <div class="form-group">

                <label>Role Name</label>

                <input
                    name="name"
                    placeholder="Enter role name"
                    required
                >

            </div>

            <div class="form-group">

                <label>Description</label>

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

                <label>Household Name</label>

                <input
                    name="name"
                    placeholder="Enter household name"
                    required
                >

            </div>

            <div class="form-group">

                <label>Unit</label>

                <input
                    name="unit"
                    placeholder="Example: A-101"
                    required
                >

            </div>

            <div class="form-group">

                <label>Onboarding Status</label>

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

                <label>Policy Title</label>

                <input
                    name="title"
                    placeholder="Enter policy title"
                    required
                >

            </div>

            <div class="form-group">

                <label>Description</label>

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

                <label>Module Name</label>

                <input
                    name="name"
                    placeholder="Enter module name"
                    required
                >

            </div>

            <div class="form-group">

                <label>Status</label>

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


// =====================================================
// HANDLE QUICK ACTION
// =====================================================

function handleAction(action) {

    if (action === "add-user") {

        show(addUserModal);

        return;

    }


    if (action === "announcement") {

        show(announcementModal);

        return;

    }


    if (actionForms[action]) {

        openActionForm(
            actionForms[action]
        );

        return;

    }

}


// =====================================================
// OPEN REUSABLE ACTION FORM
// =====================================================

function openActionForm(config) {

    const body =
        genericActionModal.querySelector(
            ".generic-action-body"
        );


    if (!body) return;


    body.innerHTML = `

        <form
            class="modal-form"
            id="genericActionForm"
        >

            <div class="modal-header">

                <div>

                    <h2>
                        ${config.title}
                    </h2>

                    <p>
                        Complete the details below.
                    </p>

                </div>

                <button
                    type="button"
                    class="modal-close"
                    data-action-close
                >
                    ×
                </button>

            </div>


            <div style="padding: 25px 28px;">

                ${config.fields}

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    data-action-close
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-btn"
                >
                    ${config.button}
                </button>

            </div>

        </form>

    `;


    show(
        genericActionModal
    );


    const form =
        document.getElementById(
            "genericActionForm"
        );


    form.addEventListener(
        "submit",
        event =>
            submitActionForm(
                event,
                form,
                config
            )
    );


    form
        .querySelectorAll(
            "[data-action-close]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    hide(
                        genericActionModal
                    );

                }
            );

        });

}


// =====================================================
// SUBMIT REUSABLE ACTION
// =====================================================

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


// =====================================================
// CLOSE MODALS
// =====================================================

document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const modal =
                    document.getElementById(
                        button.dataset.closeModal
                    );


                hide(modal);

            }
        );

    });


// =====================================================
// ADD USER
// =====================================================

const addUserForm =
    document.getElementById(
        "addUserForm"
    );


addUserForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const formData =
            new FormData(
                addUserForm
            );


        const user =
            Object.fromEntries(
                formData.entries()
            );


        const button =
            addUserForm.querySelector(
                'button[type="submit"]'
            );


        button.disabled = true;

        button.textContent =
            "Creating...";


        try {

            const result =
                await api(
                    "/api/users",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                user
                            )
                    }
                );


            alert(
                result.message
            );


            addUserForm.reset();

            hide(addUserModal);

            await loadDashboard();


        } catch (error) {

            alert(
                error.message
            );


        } finally {

            button.disabled = false;

            button.textContent =
                "Create User";

        }

    }
);


// =====================================================
// ANNOUNCEMENT
// =====================================================

const announcementForm =
    document.getElementById(
        "announcementForm"
    );


announcementForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const formData =
            new FormData(
                announcementForm
            );


        const announcement =
            Object.fromEntries(
                formData.entries()
            );


        announcement.inAppNotice =
            formData.has(
                "inAppNotice"
            );


        announcement.pushNotification =
            formData.has(
                "pushNotification"
            );


        announcement.emailBroadcast =
            formData.has(
                "emailBroadcast"
            );


        const button =
            announcementForm.querySelector(
                'button[type="submit"]'
            );


        button.disabled = true;

        button.textContent =
            "Broadcasting...";


        try {

            const result =
                await api(
                    "/api/announcements",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                announcement
                            )
                    }
                );


            alert(
                result.message
            );


            announcementForm.reset();

            hide(
                announcementModal
            );


            await loadDashboard();


        } catch (error) {

            alert(
                error.message
            );


        } finally {

            button.disabled = false;

            button.textContent =
                "Broadcast Announcement";

        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn?.addEventListener(
    "click",
    () => {

        currentEmail = "";

        verificationToken = "";


        otpInputs.forEach(
            input => {
                input.value = "";
            }
        );


        hide(dashboardScreen);

        hide(otpScreen);

        show(loginScreen);


        message(
            loginMessage,
            ""
        );

        message(
            otpMessage,
            ""
        );

    }
);


// =====================================================
// SEARCH
// =====================================================

const searchInput =
    document.querySelector(
        "[data-dashboard-search]"
    );


searchInput?.addEventListener(
    "input",
    () => {

        const value =
            searchInput.value
                .trim()
                .toLowerCase();


        document
            .querySelectorAll(
                "[data-module]"
            )
            .forEach(button => {

                button.style.display =
                    !value ||
                    button.textContent
                        .toLowerCase()
                        .includes(value)
                        ? ""
                        : "none";

            });

    }
);


// =====================================================
// NOTIFICATIONS
// =====================================================

document
    .querySelector(
        "[data-notifications]"
    )
    ?.addEventListener(
        "click",
        () => {

            alert(
                "No new notifications."
            );

        }
    );


// =====================================================
// INITIAL STATE
// =====================================================

hide(otpScreen);

hide(dashboardScreen);

hide(moduleContent);

updateDashboardDate();