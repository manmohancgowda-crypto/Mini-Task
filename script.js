
"use strict";

/* =====================================
   0. AUTH GUARD
   Belt-and-suspenders check in addition to
   the inline script inside index.html <head>.
   If szLoggedIn is not "true", redirect to login.
===================================== */

if (localStorage.getItem("szLoggedIn") !== "true") {
    location.replace("login.html");
}


/* =====================================
   1. SAFE LOCAL STORAGE HELPERS
   These wrappers prevent uncaught errors if the
   browser blocks localStorage (e.g. private mode).
===================================== */

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Could not save local data:", error);
        return false;
    }
}

function readText(key, fallback) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

function writeText(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error("Could not save preference:", error);
    }
}


/* =====================================
   2. DARK MODE
   Reads saved preference from localStorage,
   applies the correct class to <body>, and
   listens for clicks on the toggle button.
===================================== */

const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-mode", dark);
    themeToggle.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

applyTheme(readText("sportsTheme", "light"));

themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-mode")
        ? "light"
        : "dark";
    applyTheme(nextTheme);
    writeText("sportsTheme", nextTheme);
});


/* =====================================
   2b. USER GREETING & LOGOUT
   Reads the username stored during login and
   displays it in the nav. The logout button
   clears the session and redirects to login.
===================================== */

const logoutBtn    = document.getElementById("logoutBtn");
const userGreeting = document.getElementById("userGreeting");

// Display the stored username in the nav bar
const storedUser = localStorage.getItem("szUser");
if (storedUser && userGreeting) {
    userGreeting.textContent = `👋 Hi, ${storedUser}!`;
}

// Logout: remove session keys, return to login page
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("szLoggedIn");
    localStorage.removeItem("szUser");
    location.replace("login.html");
});


/* =====================================
   3. ACTIVITY SEARCH AND FILTER
   Filters the activity cards in real time using
   three criteria: text search, category dropdown,
   and favourites-only toggle.
===================================== */

const searchInput         = document.getElementById("activitySearch");
const categoryFilter      = document.getElementById("categoryFilter");
const clearSearchButton   = document.getElementById("clearSearch");
const favoritesOnlyButton = document.getElementById("favoritesOnly");
const activityCount       = document.getElementById("activityCount");

const activityCards = [
    ...document.querySelectorAll(".activity-card")
];

// Load saved favourites from localStorage (array of title strings)
const savedFavorites = readStorage("sportsFavorites", []);
let favorites = Array.isArray(savedFavorites)
    ? savedFavorites.filter(item => typeof item === "string")
    : [];

let showFavoritesOnly = false;

function saveFavorites() {
    if (!writeStorage("sportsFavorites", favorites)) {
        activityCount.textContent =
            "Could not save favourites. Browser storage may be unavailable.";
    }
}

function updateFavoriteButtons() {
    activityCards.forEach(card => {
        const title  = card.querySelector("h3").textContent.trim();
        const button = card.querySelector(".favorite-btn");
        const isFav  = favorites.includes(title);

        button.classList.toggle("is-favorite", isFav);
        button.textContent = isFav ? "♥ Remove Favourite" : "♡ Add to Favourites";
        button.setAttribute("aria-pressed", String(isFav));
    });
}

function filterActivities() {
    const searchText = searchInput.value.trim().toLowerCase();
    const category   = categoryFilter.value;
    let visible      = 0;

    activityCards.forEach(card => {
        const title          = card.querySelector("h3").textContent.trim();
        const searchableText = card.textContent.toLowerCase();
        const cardCategory   = card.dataset.category;

        const matchesSearch    = searchableText.includes(searchText);
        const matchesCategory  = category === "all" || category === cardCategory;
        const matchesFavorites = !showFavoritesOnly || favorites.includes(title);

        const show = matchesSearch && matchesCategory && matchesFavorites;
        card.hidden = !show;
        if (show) visible++;
    });

    activityCount.textContent =
        `${visible} activit${visible === 1 ? "y" : "ies"} found.`;

    favoritesOnlyButton.textContent = showFavoritesOnly
        ? "Show All Activities"
        : "♥ Show Favourites";

    updateFavoriteButtons();
}

// Attach favourite toggle to each card's button
activityCards.forEach(card => {
    const button = card.querySelector(".favorite-btn");
    button.addEventListener("click", () => {
        const title = card.querySelector("h3").textContent.trim();
        if (favorites.includes(title)) {
            favorites = favorites.filter(item => item !== title);
        } else {
            favorites.push(title);
        }
        saveFavorites();
        filterActivities();
    });
});

searchInput.addEventListener("input", filterActivities);
categoryFilter.addEventListener("change", filterActivities);

clearSearchButton.addEventListener("click", () => {
    searchInput.value    = "";
    categoryFilter.value = "all";
    showFavoritesOnly    = false;
    filterActivities();
    searchInput.focus();
});

favoritesOnlyButton.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    filterActivities();
});

filterActivities();


/* =====================================
   4. CONTACT FORM VALIDATION
   Validates Name, Email and Message on every
   keystroke and again on submit. Shows coloured
   error messages and a red border on invalid fields.
===================================== */

const contactForm  = document.getElementById("contactForm");
const nameInput    = document.getElementById("name");
const emailInput   = document.getElementById("email");
const messageInput = document.getElementById("message");
const formStatus   = document.getElementById("formStatus");

function showError(input, errorId, message) {
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = message;
    input.classList.toggle("invalid", Boolean(message));
    input.setAttribute("aria-invalid", String(Boolean(message)));
}

function validateName() {
    const name = nameInput.value.trim();
    if (name.length < 2) {
        showError(nameInput, "nameError", "Please enter at least 2 characters.");
        return false;
    }
    if (name.length > 80) {
        showError(nameInput, "nameError", "Name must be 80 characters or fewer.");
        return false;
    }
    showError(nameInput, "nameError", "");
    return true;
}

function validateEmail() {
    const email   = emailInput.value.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(email) || email.length > 254) {
        showError(emailInput, "emailError", "Please enter a valid email address.");
        return false;
    }
    showError(emailInput, "emailError", "");
    return true;
}

function validateMessage() {
    const message = messageInput.value.trim();
    if (message.length < 10) {
        showError(messageInput, "messageError",
            "Message must contain at least 10 characters.");
        return false;
    }
    if (message.length > 2000) {
        showError(messageInput, "messageError",
            "Message must be 2000 characters or fewer.");
        return false;
    }
    showError(messageInput, "messageError", "");
    return true;
}

nameInput.addEventListener("input",    validateName);
emailInput.addEventListener("input",   validateEmail);
messageInput.addEventListener("input", validateMessage);

contactForm.addEventListener("submit", event => {
    event.preventDefault();
    formStatus.textContent = "";
    formStatus.style.color      = "";
    formStatus.style.background = "";

    const validName    = validateName();
    const validEmail   = validateEmail();
    const validMessage = validateMessage();

    if (!validName || !validEmail || !validMessage) {
        formStatus.textContent      = "Please correct the errors above.";
        formStatus.style.color      = "#dc2626";
        formStatus.style.background = "rgba(220,38,38,0.08)";
        const firstInvalid = contactForm.querySelector(".invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
    }

    // Demonstration only — no data is transmitted
    formStatus.textContent      = "✅ Validation passed! This demo does not send the message.";
    formStatus.style.color      = "#166534";
    formStatus.style.background = "rgba(22,101,52,0.08)";
});

contactForm.addEventListener("reset", () => {
    setTimeout(() => {
        showError(nameInput,    "nameError",    "");
        showError(emailInput,   "emailError",   "");
        showError(messageInput, "messageError", "");
        formStatus.textContent      = "";
        formStatus.style.color      = "";
        formStatus.style.background = "";
    }, 0);
});


/* =====================================
   5. MATCH SCORES AND FIXTURES API
   Fetches data from the backend Express server
   (/api/matches), which in turn calls the real
   football API with the secret API key.
   Results are rendered both as cards and as a table.
===================================== */

const matchDateInput   = document.getElementById("matchDate");
const loadScoresButton = document.getElementById("loadScores");
const liveOnlyButton   = document.getElementById("liveOnly");
const scoreStatus      = document.getElementById("scoreStatus");
const matchList        = document.getElementById("matchList");
const viewToggle       = document.getElementById("viewToggle");
const matchTableBody   = document.getElementById("matchTableBody");
const matchTableWrapper= document.getElementById("matchTableWrapper");
const cardViewBtn      = document.getElementById("cardViewBtn");
const tableViewBtn     = document.getElementById("tableViewBtn");

// Track the active view and last loaded data
let currentView      = "cards"; // "cards" | "table"
let currentMatchData = [];

// Set today's date as the default value of the date picker
function getLocalDateString() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day   = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

matchDateInput.value = getLocalDateString();

/* ---- Build a single match card (card view) ---- */
function createMatchCard(match) {
    const fixture = match.fixture || {};
    const teams   = match.teams   || {};
    const goals   = match.goals   || {};
    const league  = match.league  || {};
    const status  = fixture.status || {};

    const home = teams.home?.name || "Home team";
    const away = teams.away?.name || "Away team";

    const card     = document.createElement("article");
    card.className = "match-card";

    const heading = document.createElement("h3");
    heading.textContent = `${home} vs ${away}`;

    const leagueText = document.createElement("p");
    leagueText.textContent = league.name || "Football";

    const score = document.createElement("p");
    score.className = "match-score";
    score.textContent = (goals.home != null && goals.away != null)
        ? `${goals.home} — ${goals.away}`
        : "vs";

    const statusBadge = document.createElement("span");
    statusBadge.className   = "match-status";
    statusBadge.textContent = status.long || "Status unavailable";

    const time = document.createElement("p");
    if (fixture.date) {
        const d = new Date(fixture.date);
        time.textContent = Number.isNaN(d.getTime())
            ? "Kick-off time unavailable"
            : `⏱️ Kick-off: ${d.toLocaleString()}`;
    } else {
        time.textContent = "Kick-off time unavailable";
    }

    card.append(heading, leagueText, score, statusBadge, time);
    return card;
}

/* ---- Apply the selected view (card or table) ---- */
function applyView(view) {
    if (view === "cards") {
        matchList.hidden         = false;
        matchTableWrapper.hidden = true;
        cardViewBtn.classList.add("active");
        tableViewBtn.classList.remove("active");
    } else {
        matchList.hidden         = true;
        matchTableWrapper.hidden = false;
        tableViewBtn.classList.add("active");
        cardViewBtn.classList.remove("active");
    }
    currentView = view;
}

cardViewBtn.addEventListener("click",  () => applyView("cards"));
tableViewBtn.addEventListener("click", () => applyView("table"));

/* ---- HTML-escape helper (prevents XSS) ---- */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;")
        .replace(/'/g,  "&#x27;");
}

/* ---- Render match data into the <table> ---- */
function renderMatchTable(matches) {
    matchTableBody.replaceChildren();

    matches.forEach(match => {
        const fixture = match.fixture || {};
        const teams   = match.teams   || {};
        const goals   = match.goals   || {};
        const league  = match.league  || {};
        const status  = fixture.status || {};

        const home  = teams.home?.name || "Home";
        const away  = teams.away?.name || "Away";
        const score = (goals.home != null && goals.away != null)
            ? `${goals.home} – ${goals.away}`
            : "vs";

        let kickoff = "—";
        if (fixture.date) {
            const d = new Date(fixture.date);
            if (!Number.isNaN(d.getTime())) kickoff = d.toLocaleString();
        }

        const tr = document.createElement("tr");

        // Home team cell
        const tdHome = document.createElement("td");
        tdHome.className   = "table-team";
        tdHome.textContent = home;

        // Score cell
        const tdScore = document.createElement("td");
        tdScore.className   = "table-score";
        tdScore.textContent = score;

        // Away team cell
        const tdAway = document.createElement("td");
        tdAway.className   = "table-team";
        tdAway.textContent = away;

        // League cell
        const tdLeague = document.createElement("td");
        tdLeague.textContent = league.name || "—";

        // Status cell (with styled badge)
        const tdStatus = document.createElement("td");
        const badge    = document.createElement("span");
        badge.className   = "table-status";
        badge.textContent = status.long || "—";
        tdStatus.appendChild(badge);

        // Kick-off time cell
        const tdTime = document.createElement("td");
        tdTime.className   = "table-time";
        tdTime.textContent = kickoff;

        tr.append(tdHome, tdScore, tdAway, tdLeague, tdStatus, tdTime);
        matchTableBody.appendChild(tr);
    });
}

/* ---- Main fetch function ---- */
async function loadMatches(type = "today") {
    if (loadScoresButton.disabled || liveOnlyButton.disabled) return;

    const date = matchDateInput.value;
    if (type === "today" && !date) {
        scoreStatus.textContent = "Please select a match date.";
        return;
    }

    // Disable buttons and clear previous results
    loadScoresButton.disabled = true;
    liveOnlyButton.disabled   = true;
    matchList.replaceChildren();
    matchTableBody.replaceChildren();
    viewToggle.hidden = true;

    scoreStatus.textContent = type === "live"
        ? "🔴 Loading live matches..."
        : "📅 Loading fixtures...";

    try {
        const params = new URLSearchParams({ type });
        if (type === "today") params.set("date", date);

        const response = await fetch(`/api/matches?${params.toString()}`);
        const data     = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load matches.");
        }
        if (!Array.isArray(data)) {
            throw new Error("The API returned an unexpected response.");
        }
        if (data.length === 0) {
            scoreStatus.textContent = type === "live"
                ? "No live matches are currently available."
                : "No fixtures were found for the selected date.";
            return;
        }

        // Cache data so view switching doesn't need another fetch
        currentMatchData = data;

        // Build card view
        const fragment = document.createDocumentFragment();
        data.forEach(match => fragment.appendChild(createMatchCard(match)));
        matchList.appendChild(fragment);

        // Build table view
        renderMatchTable(data);

        // Show the view toggle and apply the current view
        viewToggle.hidden = false;
        applyView(currentView);

        scoreStatus.textContent =
            `✅ ${data.length} match(es) loaded successfully.`;

    } catch (error) {
        console.error("Match loading error:", error);
        scoreStatus.textContent =
            `❌ Could not load matches: ${error.message}`;
    } finally {
        loadScoresButton.disabled = false;
        liveOnlyButton.disabled   = false;
    }
}

loadScoresButton.addEventListener("click", () => loadMatches("today"));
liveOnlyButton.addEventListener("click",   () => loadMatches("live"));
