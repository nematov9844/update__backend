const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// CORS sozlamalarini aniqlash
app.use(cors({
    origin: "*",  // Barcha domenlardan kelgan so'rovlarga ruxsat berish
    methods: ["GET", "POST", "PUT", "DELETE"],  // Ruxsat berilgan metodlar
    allowedHeaders: ["Content-Type", "Authorization"]  // Ruxsat berilgan header'lar
}));

app.use(express.json()); // express.json() body-parser o‘rniga

const PORT = process.env.PORT || 5000;

let data = [];
let currentId = 1;

// JWT tokenni tekshirish middleware'i
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];  // Bearer tokenni olish
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user; // Tokenni to‘g‘ri bo‘lsa, foydalanuvchini qo‘shish
    next();  // So‘rovni davom ettirish
  });
};

// Login endpointi
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "123456") {
    const token = jwt.sign({ username, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Tokenning muddati 1 soat
    });
    return res.json({ status: "success", token });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
});

// Items yaratish endpointi
app.post("/items", authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const newItem = { id: currentId++, name, description };
  data.push(newItem);
  res.status(201).json({ message: "Item created", item: newItem });
});

// Itemsni olish endpointi
app.get("/items", authenticateToken, (req, res) => {
  res.json(data);
});

// Itemni yangilash endpointi
app.put("/items/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const itemIndex = data.findIndex((item) => item.id == id);
  
  // Agar item mavjud bo'lmasa
  if (itemIndex === -1) return res.status(404).json({ error: "Item not found" });

  // Itemni yangilash
  data[itemIndex] = { id: Number(id), name, description };
  res.json({ message: "Item updated", item: data[itemIndex] });
});

// Itemni o'chirish endpointi
app.delete("/items/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const itemIndex = data.findIndex((item) => item.id == id);
  
  // Agar item mavjud bo'lmasa
  if (itemIndex === -1) return res.status(404).json({ error: "Item not found" });

  // Itemni o'chirish
  data.splice(itemIndex, 1);
  res.json({ message: "Item deleted" });
});

// Serverni ishga tushurish
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
