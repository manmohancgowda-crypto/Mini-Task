
"use strict";

require("dotenv").config();

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_FOOTBALL_KEY;

app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
    res.json({
        server: "running",
        apiKeyConfigured: Boolean(API_KEY)
    });
});

app.get("/api/matches", async (req, res) => {
    if (!API_KEY) {
        return res.status(500).json({
            message: "API key not found. Check your .env file."
        });
    }

    const type = req.query.type === "live" ? "live" : "today";

    const url = new URL(
        "https://v3.football.api-sports.io/fixtures"
    );

    if (type === "live") {
        url.searchParams.set("live", "all");
    } else {
        const date = req.query.date;

        if (
            typeof date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(date)
        ) {
            return res.status(400).json({
                message: "Select a valid date in YYYY-MM-DD format."
            });
        }

        const parsedDate = new Date(`${date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== date
        ) {
            return res.status(400).json({
                message: "The selected date is invalid."
            });
        }

        url.searchParams.set("date", date);
    }

    url.searchParams.set("timezone", "Asia/Kolkata");

    try {
        const response = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY,
                "Accept": "application/json"
            },
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            // Do not send the provider's raw response or credentials
            // to the browser.
            console.error("Football API HTTP status:", response.status);

            const messages = {
                401: "API authentication failed. Check your API key.",
                403: "API access denied. Check your subscription or permissions.",
                429: "API rate limit reached. Wait before trying again."
            };

            return res.status(502).json({
                message: messages[response.status] ||
                    `Sports provider returned HTTP ${response.status}.`
            });
        }

        const data = await response.json();

        if (data.errors &&
            Object.keys(data.errors).length > 0) {
            console.error("Football API reported an error:", data.errors);

            return res.status(502).json({
                message: "The provider rejected the request. Check your key, plan and API parameters."
            });
        }

        if (!Array.isArray(data.response)) {
            return res.status(502).json({
                message: "The provider returned an unexpected response."
            });
        }

        res.set("Cache-Control", "no-store");
        return res.json(data.response);

    } catch (error) {
        console.error("Football API request failed:", error.message);

        return res.status(502).json({
            message: error.name === "TimeoutError" ||
                error.name === "AbortError"
                ? "The sports API timed out. Try again later."
                : "Could not connect to the sports API. Check your internet connection."
        });
    }
});

app.listen(PORT, () => {
    console.log(`SportsZone running at http://localhost:${PORT}`);
    console.log(`API key configured: ${Boolean(API_KEY)}`);
});
