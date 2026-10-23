
"use strict";

/* =====================================
   1. SAFE LOCAL STORAGE HELPERS
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
   3. ACTIVITY SEARCH AND FILTER
===================================== */

const searchInput = document.getElementById("activitySearch");
const categoryFilter = document.getElementById("categoryFilter");
const clearSearchButton = document.getElementById("clearSearch");
const favoritesOnlyButton = document.getElementById("favoritesOnly");
const activityCount = document.getElementById("activityCount");

const activityCards = [
    ...document.querySelectorAll(".activity-card")
];

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
        const title = card.querySelector("h3").textContent.trim();
        const button = card.querySelector(".favorite-btn");
        const isFavorite = favorites.includes(title);

        button.classList.toggle("is-favorite", isFavorite);
        button.textContent = isFavorite
            ? "♥ Remove Favourite"
            : "♡ Add to Favourites";

        button.setAttribute("aria-pressed", String(isFavorite));
    });
}

function filterActivities() {
    const searchText = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    let visible = 0;

    activityCards.forEach(card => {
        const title = card.querySelector("h3").textContent.trim();
        const searchableText = card.textContent.toLowerCase();
        const cardCategory = card.dataset.category;

        const matchesSearch = searchableText.includes(searchText);
        const matchesCategory =
            category === "all" || category === cardCategory;
        const matchesFavorites =
            !showFavoritesOnly || favorites.includes(title);

        const show =
            matchesSearch && matchesCategory && matchesFavorites;

        card.hidden = !show;

        if (show) visible++;
    });

    activityCount.textContent =
        `${visible} activit${visible === 1 ? "y" : "ies"} found.`;

    favoritesOnlyButton.textContent = showFavoritesOnly
        ? "Show All Activities"
        : "Show Favourites";

    updateFavoriteButtons();
}

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
    searchInput.value = "";
    categoryFilter.value = "all";
    showFavoritesOnly = false;
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
===================================== */

const contactForm = document.getElementById("contactForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");
const formStatus = document.getElementById("formStatus");

function showError(input, errorId, message) {
    const errorElement = document.getElementById(errorId);

    errorElement.textContent = message;
    input.classList.toggle("invalid", Boolean(message));
    input.setAttribute("aria-invalid", String(Boolean(message)));
}

function validateName() {
    const name = nameInput.value.trim();

    if (name.length < 2) {
        showError(nameInput, "nameError",
            "Please enter at least 2 characters.");
        return false;
    }

    if (name.length > 80) {
        showError(nameInput, "nameError",
            "Name must be 80 characters or fewer.");
        return false;
    }

    showError(nameInput, "nameError", "");
    return true;
}

function validateEmail() {
    const email = emailInput.value.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pattern.test(email) || email.length > 254) {
        showError(emailInput, "emailError",
            "Please enter a valid email address.");
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

nameInput.addEventListener("input", validateName);
emailInput.addEventListener("input", validateEmail);
messageInput.addEventListener("input", validateMessage);

contactForm.addEventListener("submit", event => {
    event.preventDefault();

    formStatus.textContent = "";

    const validName = validateName();
    const validEmail = validateEmail();
    const validMessage = validateMessage();

    if (!validName || !validEmail || !validMessage) {
        formStatus.textContent = "Please correct the errors above.";
        formStatus.style.color = "#b91c1c";

        const firstInvalid = contactForm.querySelector(".invalid");
        if (firstInvalid) firstInvalid.focus();

        return;
    }

    // Demonstration only. No message is sent to a server.
    // This avoids storing email addresses and message contents locally.
    formStatus.textContent =
        "Validation successful! Your message is ready, but this demo does not send it.";
    formStatus.style.color = "#166534";
});

contactForm.addEventListener("reset", () => {
    setTimeout(() => {
        showError(nameInput, "nameError", "");
        showError(emailInput, "emailError", "");
        showError(messageInput, "messageError", "");

        formStatus.textContent = "";
        formStatus.style.color = "";
    }, 0);
});


/* =====================================
   5. MATCH SCORES AND FIXTURES API
===================================== */

const matchDateInput = document.getElementById("matchDate");
const loadScoresButton = document.getElementById("loadScores");
const liveOnlyButton = document.getElementById("liveOnly");
const scoreStatus = document.getElementById("scoreStatus");
const matchList = document.getElementById("matchList");

function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

matchDateInput.value = getLocalDateString();

function createMatchCard(match) {
    const fixture = match.fixture || {};
    const teams = match.teams || {};
    const goals = match.goals || {};
    const league = match.league || {};
    const status = fixture.status || {};

    const home = teams.home?.name || "Home team";
    const away = teams.away?.name || "Away team";

    const card = document.createElement("article");
    card.className = "match-card";

    const heading = document.createElement("h3");
    heading.textContent = `${home} vs ${away}`;

    const leagueText = document.createElement("p");
    leagueText.textContent = league.name || "Football";

    const score = document.createElement("p");
    score.className = "match-score";

    if (goals.home != null && goals.away != null) {
        score.textContent = `${goals.home} - ${goals.away}`;
    } else {
        score.textContent = "vs";
    }

    const statusBadge = document.createElement("span");
    statusBadge.className = "match-status";
    statusBadge.textContent = status.long || "Status unavailable";

    const time = document.createElement("p");

    if (fixture.date) {
        const date = new Date(fixture.date);

        time.textContent = Number.isNaN(date.getTime())
            ? "Kick-off time unavailable"
            : `Kick-off: ${date.toLocaleString()}`;
    } else {
        time.textContent = "Kick-off time unavailable";
    }

    card.append(heading, leagueText, score, statusBadge, time);

    return card;
}

async function loadMatches(type = "today") {
    if (loadScoresButton.disabled || liveOnlyButton.disabled) {
        return;
    }

    const date = matchDateInput.value;

    if (type === "today" && !date) {
        scoreStatus.textContent = "Please select a match date.";
        return;
    }

    loadScoresButton.disabled = true;
    liveOnlyButton.disabled = true;
    matchList.replaceChildren();

    scoreStatus.textContent = type === "live"
        ? "Loading live matches..."
        : "Loading fixtures...";

    try {
        const params = new URLSearchParams({ type });

        if (type === "today") {
            params.set("date", date);
        }

        const response = await fetch(`/api/matches?${params.toString()}`);

        const data = await response.json();

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

        const fragment = document.createDocumentFragment();

        data.forEach(match => {
            fragment.appendChild(createMatchCard(match));
        });

        matchList.appendChild(fragment);

        scoreStatus.textContent =
            `${data.length} match(es) loaded successfully.`;
    } catch (error) {
        console.error("Match loading error:", error);

        scoreStatus.textContent =
            `Could not load matches: ${error.message} Check your server and API key.`;
    } finally {
        loadScoresButton.disabled = false;
        liveOnlyButton.disabled = false;
    }
}

loadScoresButton.addEventListener("click", () => loadMatches("today"));
liveOnlyButton.addEventListener("click", () => loadMatches("live"));
