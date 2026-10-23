
"use strict";

/* ========================
   AUTH REDIRECT
   If the user is already logged in, skip
   the login page and go straight to the app.
======================== */
if (localStorage.getItem("szLoggedIn") === "true") {
    location.replace("index.html");
}

/* ========================
   VALID CREDENTIALS
   In a real app these would be verified on the
   server. Here we keep them as constants so
   the reviewer can clearly see the check.
======================== */
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "sports123";

/* ========================
   DOM REFERENCES
======================== */
const loginForm         = document.getElementById("loginForm");
const loginCard         = document.getElementById("loginCard");
const usernameInput     = document.getElementById("username");
const passwordInput     = document.getElementById("password");
const usernameError     = document.getElementById("usernameError");
const passwordError     = document.getElementById("passwordError");
const authError         = document.getElementById("authError");
const togglePasswordBtn = document.getElementById("togglePassword");
const loginBtn          = document.getElementById("loginBtn");
const btnLabel          = document.getElementById("btnLabel");
const btnArrow          = document.getElementById("btnArrow");
const btnSpinner        = document.getElementById("btnSpinner");
const eyeOpen           = document.getElementById("eyeOpen");
const eyeClosed         = document.getElementById("eyeClosed");

/* ========================
   PASSWORD VISIBILITY TOGGLE
   Clicking the eye icon switches the input
   between type="password" and type="text".
======================== */
togglePasswordBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    eyeOpen.hidden   =  isHidden;   // hide the open eye when text is visible
    eyeClosed.hidden = !isHidden;   // show the slashed eye when text is visible
    togglePasswordBtn.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
    );
});

/* ========================
   FIELD-LEVEL VALIDATION HELPERS
======================== */
function setFieldError(input, errorEl, message) {
    errorEl.textContent = message;
    input.classList.add("invalid");
    input.setAttribute("aria-invalid", "true");
}

function clearFieldError(input, errorEl) {
    errorEl.textContent = "";
    input.classList.remove("invalid");
    input.removeAttribute("aria-invalid");
}

/* Validate username: required, min 3 characters */
function validateUsername() {
    const val = usernameInput.value.trim();

    if (val.length === 0) {
        setFieldError(usernameInput, usernameError, "Username is required.");
        return false;
    }
    if (val.length < 3) {
        setFieldError(usernameInput, usernameError, "Must be at least 3 characters.");
        return false;
    }
    clearFieldError(usernameInput, usernameError);
    return true;
}

/* Validate password: required, min 6 characters */
function validatePassword() {
    const val = passwordInput.value;

    if (val.length === 0) {
        setFieldError(passwordInput, passwordError, "Password is required.");
        return false;
    }
    if (val.length < 6) {
        setFieldError(passwordInput, passwordError, "Must be at least 6 characters.");
        return false;
    }
    clearFieldError(passwordInput, passwordError);
    return true;
}

/* Re-validate on every keystroke ONLY once the field has been marked invalid,
   so the error clears as soon as the user fixes the issue. */
usernameInput.addEventListener("input", () => {
    if (usernameInput.classList.contains("invalid")) validateUsername();
});

passwordInput.addEventListener("input", () => {
    if (passwordInput.classList.contains("invalid")) validatePassword();
});

/* ========================
   SHAKE ANIMATION
   Triggered on validation failure or wrong credentials.
   The animation is restarted each time by removing the
   class, forcing a reflow, then adding it again.
======================== */
function shakeCard() {
    loginCard.classList.remove("shake");
    void loginCard.offsetWidth; // force browser reflow to restart animation
    loginCard.classList.add("shake");
    loginCard.addEventListener("animationend", () => {
        loginCard.classList.remove("shake");
    }, { once: true });
}

/* ========================
   LOADING STATE
   Disables the button and shows a spinner
   while the credential check runs.
======================== */
function setLoading(isLoading) {
    loginBtn.disabled      = isLoading;
    btnLabel.textContent   = isLoading ? "Logging in..." : "Login to SportsZone";
    btnArrow.hidden        =  isLoading;
    btnSpinner.hidden      = !isLoading;
}

/* ========================
   FORM SUBMIT HANDLER
   1. Prevent default browser submission
   2. Run field validation
   3. Simulate a short server delay
   4. Check credentials
   5. On success: save session to localStorage and redirect
   6. On failure: show error and shake the card
======================== */
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Reset any previous auth-level error
    authError.hidden = true;

    const validUser = validateUsername();
    const validPass = validatePassword();

    if (!validUser || !validPass) {
        shakeCard();
        return;
    }

    const enteredUser = usernameInput.value.trim();
    const enteredPass = passwordInput.value;

    setLoading(true);

    // Simulated 900 ms network delay for realism
    setTimeout(() => {
        if (enteredUser === VALID_USERNAME && enteredPass === VALID_PASSWORD) {

            // Save login state and username to localStorage
            localStorage.setItem("szLoggedIn", "true");
            localStorage.setItem("szUser",     enteredUser);

            // Redirect to the main app
            location.replace("index.html");

        } else {
            setLoading(false);
            authError.textContent = "❌ Incorrect username or password. Try: admin / sports123";
            authError.hidden      = false;
            passwordInput.value   = "";
            clearFieldError(passwordInput, passwordError);
            shakeCard();
        }
    }, 900);
});
