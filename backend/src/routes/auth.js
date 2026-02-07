import { Router } from "express";
import jwt from "jsonwebtoken";
import User, { hashPassword, checkPassword } from "../models/User.js";
import { authMiddleware, JWT_SECRET } from "../middleware/auth.js";

const router = Router();

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function userToJson(user) {
  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName || "",
    phone: user.phone || "",
    address: user.address || "",
    walletAddress: user.walletAddress || "",
    role: user.role || "customer",
    carInfo: user.carInfo || "",
    carPlate: user.carPlate || "",
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, phone, address } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Пароль не менее 6 символов" });
    }
    if (!fullName?.trim()) {
      return res.status(400).json({ error: "Укажите ФИО" });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ error: "Укажите номер телефона" });
    }
    if (!address?.trim()) {
      return res.status(400).json({ error: "Укажите адрес" });
    }
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(400).json({ error: "Email уже зарегистрирован" });
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: email.trim().toLowerCase(),
      passwordHash,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
    });
    const token = signToken(user._id);
    res.status(201).json({ token, user: userToJson(user) });
  } catch (e) {
    res.status(500).json({ error: e.message || "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: "Wrong email or password" });
    const ok = await checkPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Wrong email or password" });
    const token = signToken(user._id);
    res.json({ token, user: userToJson(user) });
  } catch (e) {
    res.status(500).json({ error: e.message || "Login failed" });
  }
});

// GET /api/auth/me (requires token)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ user: userToJson(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/auth/me – link wallet, fullName/phone/address, role, carInfo/carPlate (для курьера)
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { walletAddress, fullName, phone, address, role, carInfo, carPlate } = req.body;
    const updates = {};
    if (walletAddress !== undefined) updates.walletAddress = (walletAddress || "").trim();
    if (fullName !== undefined) updates.fullName = String(fullName).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (address !== undefined) updates.address = String(address).trim();
    if (role === "customer" || role === "courier") updates.role = role;
    if (carInfo !== undefined) updates.carInfo = String(carInfo).trim();
    if (carPlate !== undefined) updates.carPlate = String(carPlate).trim();
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select("-passwordHash");
    res.json({ user: userToJson(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
