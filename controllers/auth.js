import bcrypt from "bcrypt";
import { createHash, randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import Doctor from "../models/doctor.js";
import User from "../models/user.js";
import { JWT_SECRET as secret } from "../configs/env.js";
import { sendResetOtpEmail } from "../utils/sendEmail.js";

const INTERNAL_ROLES = ["admin", "doctor", "receptionist"];
const PASSWORD_RESET_ROLES = ["doctor", "receptionist"];
const OTP_EXPIRY_MINUTES = 10;

function canBootstrapAdmin(totalUsers, role) {
  return totalUsers === 0 && role === "admin";
}

function buildTokenPayload(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
  };
}

function sanitizeUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return createHash("sha256").update(String(otp)).digest("hex");
}

function isOtpExpired(expiresAt) {
  return !expiresAt || new Date(expiresAt).getTime() < Date.now();
}

export async function requestPasswordResetOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      role: { $in: PASSWORD_RESET_ROLES },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or role is not eligible" });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.passwordResetOtpHash = hashOtp(otp);
    user.passwordResetOtpExpiresAt = expiresAt;
    await user.save();

    await sendResetOtpEmail(user.email, otp);

    return res.status(200).json({
      message: "Password reset OTP sent successfully",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      ...(process.env.NODE_ENV === "test" ? { otp } : {}),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to send password reset OTP",
      error: err.message,
    });
  }
}

export async function verifyPasswordResetOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      role: { $in: PASSWORD_RESET_ROLES },
    });

    if (!user || !user.passwordResetOtpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (isOtpExpired(user.passwordResetOtpExpiresAt)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const providedOtpHash = hashOtp(otp);
    if (providedOtpHash !== user.passwordResetOtpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to verify OTP",
      error: err.message,
    });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and newPassword are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        message: "newPassword must be at least 6 characters long",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      role: { $in: PASSWORD_RESET_ROLES },
    });

    if (!user || !user.passwordResetOtpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (isOtpExpired(user.passwordResetOtpExpiresAt)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    const providedOtpHash = hashOtp(otp);
    if (providedOtpHash !== user.passwordResetOtpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to reset password",
      error: err.message,
    });
  }
}

export async function bootstrapAdmin(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
      return res.status(403).json({
        message: "Bootstrap is disabled. Users already exist in the system",
      });
    }

    const { firstName, lastName, email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      message: "Bootstrap admin created successfully",
      user: sanitizeUser(adminUser),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Admin bootstrap failed",
      error: err.message,
    });
  }
}

export async function signup(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = "receptionist",
      specialization,
    } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const totalUsers = await User.countDocuments();
    const isBootstrap = canBootstrapAdmin(totalUsers, role);
    const isAdminRequest = req.user?.role === "admin";

    if (!isBootstrap && !isAdminRequest) {
      return res.status(403).json({
        message:
          "Only admin users can register receptionists and doctors. Bootstrap admin must be created first",
      });
    }

    if (!INTERNAL_ROLES.includes(role)) {
      return res.status(400).json({
        message:
          "Invalid role. Only internal users can be registered (admin, receptionist, doctor)",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    if (role === "doctor") {
      await Doctor.create({
        user: user._id,
        specialization,
      });
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Signup failed", error: err.message });
  }
}

export async function login(req, res) {
  try {
    if (!secret) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!INTERNAL_ROLES.includes(user.role)) {
      return res.status(403).json({
        message:
          "Access denied. Patient accounts are not allowed for this internal system",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(buildTokenPayload(user), secret, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Login failed", error: err.message });
  }
}

export default { signup, login };
