const express = require("express");
const session = require("express-session");
const morgan = require("morgan");
const passport = require("passport");
const bcrypt = require("bcrypt");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./config/db");
const app = express();

// Parse incoming request bodies as JSON
app.use(bodyParser.json());

// Log all requests
app.use(morgan("[:date[clf]] :method :url :status - :response-time ms"));

// Initialise express session
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "thisisverysecretandiwouldntdothisinproduction",
    resave: false,
    saveUninitialized: true
  })
);

// Initialise passport sessions
app.use(passport.initialize());
app.use(passport.session());

// Set up passport config to define strategies
require("./config/passport");

// Enable CORS within the app
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true
  })
);

// Use defined routes
app.use("/", require("./routes"));

// Handle route not found
app.use((req, res, next) => {
  return res.sendStatus(404);
});

// Handle server errors
app.use((err, req, res, next) => {
  console.log(err.stack);
  return res.status(500).json({ error: "Something broke" });
});

// Create admin user if it doesn't exist
(async () => {
  try {
    const hash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "password",
      10
    );
    const { rows } = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
      [process.env.ADMIN_USERNAME || "admin", hash]
    );
  } catch (e) {
    console.log(e);
  }
})();

// Start listening
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port " + port);
});
