// backend/server.js
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());          // allow frontend to access backend
app.use(express.json());  // parse JSON

app.get("/api/message", (req, res) => {
    res.json({ message: "Hello from bacdfgndkend 🚀" });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});