const loginScreen =
    document.getElementById("loginScreen");

const otpScreen =
    document.getElementById("otpScreen");

const dashboardScreen =
    document.getElementById("dashboardScreen");


const identifierInput =
    document.getElementById("identifier");

const generateBtn =
    document.getElementById("generateBtn");

const verifyBtn =
    document.getElementById("verifyBtn");


const loginMessage =
    document.getElementById("loginMessage");

const otpMessage =
    document.getElementById("otpMessage");


const otpInputs = Array.from(
    document.querySelectorAll(".otp-inputs input")
);


const resendBtn =
    document.getElementById("resendBtn");

const timerElement =
    document.getElementById("timer");

const backBtn =
    document.getElementById("backBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


let verificationToken = null;

let timerInterval = null;

let remainingSeconds = 44;

let userEmail = "";


// =====================================
// SCREEN FUNCTIONS
// =====================================

function show(element) {

    element.classList.remove("hidden");
}


function hide(element) {

    element.classList.add("hidden");
}


// =====================================
// OTP FUNCTIONS
// =====================================

function clearOtpInputs() {

    otpInputs.forEach((input) => {

        input.value = "";

    });
}


function getOtp() {

    return otpInputs
        .map((input) => input.value)
        .join("");
}


// =====================================
// GENERATE OTP
// =====================================

generateBtn.addEventListener(
    "click",
    async () => {

        const email =
            identifierInput.value
                .trim()
                .toLowerCase();


        if (!email) {

            loginMessage.textContent =
                "Email is required.";

            return;
        }


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            loginMessage.textContent =
                "Please enter a valid email address.";

            return;
        }


        userEmail = email;


        loginMessage.textContent =
            "Sending verification code...";


        generateBtn.disabled = true;


        try {

            const response =
                await fetch(
                    "/api/auth/generate-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email: email
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to send verification code."
                );
            }


            verificationToken =
                data.verificationToken;


            hide(loginScreen);

            show(otpScreen);


            clearOtpInputs();


            otpMessage.textContent =
                "A verification code has been sent to your email.";


            startTimer();


            otpInputs[0].focus();


        } catch (error) {

            loginMessage.textContent =
                error.message;


        } finally {

            generateBtn.disabled = false;
        }
    }
);


// =====================================
// OTP INPUTS
// =====================================

otpInputs.forEach(
    (input, index) => {

        input.addEventListener(
            "input",
            () => {

                input.value =
                    input.value
                        .replace(/\D/g, "")
                        .slice(0, 1);


                if (
                    input.value &&
                    index <
                    otpInputs.length - 1
                ) {

                    otpInputs[index + 1]
                        .focus();
                }
            }
        );


        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key ===
                    "Backspace" &&
                    !input.value &&
                    index > 0
                ) {

                    otpInputs[index - 1]
                        .focus();
                }
            }
        );

    }
);


// =====================================
// VERIFY OTP
// =====================================

verifyBtn.addEventListener(
    "click",
    async () => {

        const otp =
            getOtp().trim();


        if (otp.length !== 6) {

            otpMessage.textContent =
                "Please enter the complete 6-digit OTP.";

            return;
        }


        if (
            !verificationToken ||
            !userEmail
        ) {

            otpMessage.textContent =
                "Verification session expired. Please generate a new OTP.";

            return;
        }


        verifyBtn.disabled = true;


        otpMessage.textContent =
            "Verifying...";


        try {

            const response =
                await fetch(
                    "/api/auth/verify-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email:
                                userEmail,

                            otp:
                                otp,

                            verificationToken:
                                verificationToken
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "OTP verification failed."
                );
            }


            clearInterval(
                timerInterval
            );


            hide(otpScreen);

            show(dashboardScreen);


        } catch (error) {

            otpMessage.textContent =
                error.message;


        } finally {

            verifyBtn.disabled = false;
        }
    }
);


// =====================================
// RESEND OTP
// =====================================

resendBtn.addEventListener(
    "click",
    async () => {

        if (!userEmail) {

            return;
        }


        resendBtn.disabled = true;


        otpMessage.textContent =
            "Sending new verification code...";


        try {

            const response =
                await fetch(
                    "/api/auth/generate-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email:
                                userEmail
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to resend OTP."
                );
            }


            verificationToken =
                data.verificationToken;


            otpMessage.textContent =
                "A new verification code has been sent to your email.";


            clearOtpInputs();


            otpInputs[0].focus();


            startTimer();


        } catch (error) {

            otpMessage.textContent =
                error.message;

            resendBtn.disabled = false;
        }
    }
);


// =====================================
// TIMER
// =====================================

function startTimer() {

    clearInterval(
        timerInterval
    );


    remainingSeconds = 44;


    resendBtn.disabled = true;


    updateTimer();


    timerInterval =
        setInterval(
            () => {

                remainingSeconds--;

                updateTimer();


                if (
                    remainingSeconds <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    resendBtn.disabled =
                        false;


                    timerElement.textContent =
                        "00:00";
                }

            },
            1000
        );
}


function updateTimer() {

    const seconds =
        String(remainingSeconds)
            .padStart(2, "0");


    timerElement.textContent =
        `00:${seconds}`;
}


// =====================================
// BACK TO LOGIN
// =====================================

backBtn.addEventListener(
    "click",
    () => {

        clearInterval(
            timerInterval
        );


        hide(otpScreen);

        show(loginScreen);


        otpMessage.textContent =
            "";


        clearOtpInputs();


        verificationToken =
            null;

        userEmail =
            "";
    }
);


// =====================================
// LOGOUT
// =====================================

logoutBtn.addEventListener(
    "click",
    () => {

        clearInterval(
            timerInterval
        );


        hide(dashboardScreen);

        show(loginScreen);


        identifierInput.value =
            "";


        clearOtpInputs();


        verificationToken =
            null;

        userEmail =
            "";


        loginMessage.textContent =
            "";

        otpMessage.textContent =
            "";
    }
);