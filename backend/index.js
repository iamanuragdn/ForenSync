const express = require("express");
const cors = require("cors");

const app = express();

//frontend to access backend
app.use(cors());          
app.use(express.json()); 

app.get("/api/message", (req, res) => {
    res.json({ message: "Hello from bacdfgndkend 🚀" });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});