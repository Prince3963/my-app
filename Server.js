const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const path = require("path");
const User = require("./Models/User");

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Connect with MongoDB
mongoose.connect("mongodb://localhost:27017/myDb")
    .then(() => console.log("Database connected..."))
    .catch(() => console.log("Database not connected!"));


// Default route → Registration page
app.get("/", (req, res) => {
    res.render("register"); // views/register.ejs
});

// Show Register page
app.get("/register", (req, res) => {
    res.render("register");
});

// Show Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Register User
app.post("/register", async (req, res) => {
    try {
        const { name, email, gender, password } = req.body;

        if (!name || !email || !gender || !password) {
            return res.status(400).send("Please fill all fields");
        }

        const existUser = await User.findOne({ email });
        if (existUser) {
            return res.status(400).send("User already exists");
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            gender,
            password: hashPassword
        });

        await user.save();
        res.redirect("/login"); // Registration success → go to login
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Login User
app.post("/users/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Please enter email and password");
        }

        const existUser = await User.findOne({ email });
        if (!existUser) {
            return res.status(401).send("User not found");
        }

        const isMatched = await bcrypt.compare(password, existUser.password);
        if (!isMatched) {
            return res.status(400).send("Invalid email or password");
        }

        const token = jwt.sign({ id: existUser._id }, "secret-key", { expiresIn: "1h" });

        res.render("dashboard", { user: existUser, token });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get All Users (for testing)
app.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running at http://localhost:3000");
});
