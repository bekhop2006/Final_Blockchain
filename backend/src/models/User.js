import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    walletAddress: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["customer", "courier"], default: "customer" },
    carInfo: { type: String, trim: true, default: "" },
    carPlate: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
