require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const axios = require("axios");

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({ secret: "demo-shop-secret", resave: false, saveUninitialized: false }));

// This app owns its own password - SentinelType never sees it.
const users = {}; // { username: { passwordHash } }

const SENTINEL_API_URL = process.env.SENTINEL_API_URL; // e.g. https://sentinel-type-1.onrender.com
const SENTINEL_API_KEY = process.env.SENTINEL_API_KEY;

app.get("/", (req, res) => {
    res.redirect(req.session.user ? "/dashboard" : "/login");
});

app.get("/register", (req, res) => res.render("register", { error: null }));

app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (users[username] && users[username].enrolled) {
        return res.render("register", { error: "Username already exists" });
    }

    // Either a brand-new username, or an existing one that never finished
    // behavioral enrollment - either way, (re)create the password and send
    // them to enrollment again.
    users[username] = { passwordHash: await bcrypt.hash(password, 10), enrolled: false };
    res.redirect(`/enroll?username=${encodeURIComponent(username)}`);
});

app.get("/enroll", (req, res) => {
    res.render("enroll", { username: req.query.username || "" });
});

app.post("/api/enroll-behavior", async (req, res) => {
    try {
        const response = await axios.post(
            `${SENTINEL_API_URL}/api/v1/enroll`,
            { username: req.body.username, samples: req.body.samples },
            { headers: { "X-Sentinel-Api-Key": SENTINEL_API_KEY } }
        );

        if (response.data.success && users[req.body.username]) {
            users[req.body.username].enrolled = true;
        }

        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: "SentinelType unreachable" });
    }
});

app.get("/login", (req, res) => res.render("login", { error: null }));

app.post("/login", async (req, res) => {
    const { username, password, behavioralSample } = req.body;
    const user = users[username];

    // Step 1: DemoShop's own password check (completely unchanged, normal flow).
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.render("login", { error: "Invalid username or password" });
    }

    if (!user.enrolled) {
        return res.render("login", {
            error: `Behavioral enrollment was never completed for this account. <a href="/enroll?username=${encodeURIComponent(username)}">Finish enrollment</a>.`
        });
    }

    // Step 2: ask SentinelType for a behavioral risk decision - server-to-server.
    try {
        const response = await axios.post(
            `${SENTINEL_API_URL}/api/v1/verify`,
            { username, behavioralSample: JSON.parse(behavioralSample) },
            { headers: { "X-Sentinel-Api-Key": SENTINEL_API_KEY } }
        );

        const { decision, matchScore, reasons } = response.data;

        if (decision === "allowed") {
            req.session.user = username;
            return res.redirect("/dashboard");
        }

        return res.render("login", {
            error: `Password was correct, but behavioral verification said "${decision}" (score ${matchScore}). Reasons: ${reasons.join(", ")}`
        });
    } catch (err) {
        return res.render("login", { error: "SentinelType verification unavailable" });
    }
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("dashboard", { username: req.session.user });
});

app.listen(4000, () => console.log("DemoShop running on http://localhost:4000"));