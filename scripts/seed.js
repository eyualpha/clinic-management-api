import bcrypt from "bcrypt";
import mongoose from "mongoose";
import connectDB from "../configs/mongodb.js";
import Doctor from "../models/doctor.js";
import Patient from "../models/patient.js";
import User from "../models/user.js";

async function upsertUser({ firstName, lastName, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (existing) {
    existing.firstName = firstName;
    existing.lastName = lastName;
    existing.password = hashedPassword;
    existing.role = role;
    await existing.save();
    return existing;
  }

  return User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashedPassword,
    role,
  });
}

async function runSeed() {
  await connectDB();

  const admin = await upsertUser({
    firstName: "System",
    lastName: "Admin",
    email: "admin@clinic.local",
    password: "Admin@123",
    role: "admin",
  });

  const receptionist = await upsertUser({
    firstName: "Front",
    lastName: "Desk",
    email: "reception@clinic.local",
    password: "Reception@123",
    role: "receptionist",
  });

  const doctorUser = await upsertUser({
    firstName: "Sam",
    lastName: "Dent",
    email: "doctor@clinic.local",
    password: "Doctor@123",
    role: "doctor",
  });

  let doctor = await Doctor.findOne({ user: doctorUser._id });
  if (!doctor) {
    doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: "General Dentistry",
      assignedPatientsCount: 0,
    });
  }

  let patient = await Patient.findOne({
    firstName: "John",
    lastName: "Doe",
    phone: "0700000000",
  });

  if (!patient) {
    patient = await Patient.create({
      firstName: "John",
      lastName: "Doe",
      phone: "0700000000",
      age: 34,
      gender: "male",
      additionalInfo: "Seeded patient for workflow tests",
      assignedDoctor: doctor._id,
    });
    doctor.assignedPatientsCount += 1;
    await doctor.save();
  }

  console.log("Seed completed successfully");
  console.log("Admin:", admin.email, "password: Admin@123");
  console.log("Receptionist:", receptionist.email, "password: Reception@123");
  console.log("Doctor:", doctorUser.email, "password: Doctor@123");
  console.log("Patient:", `${patient.firstName} ${patient.lastName}`);

  await mongoose.connection.close();
}

runSeed().catch(async (err) => {
  console.error("Seed failed:", err.message);
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(1);
});
