import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

import createApp from "../app.js";
import Doctor from "../models/doctor.js";

const app = createApp();

let mongoServer;
let adminToken;
let receptionistToken;
let doctorToken;
let patientId;
let doctorId;

describe("Clinic workflow integration", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it("bootstraps admin and admin logs in", async () => {
    const bootstrapAdmin = await request(app)
      .post("/api/auth/bootstrap-admin")
      .send({
        firstName: "System",
        lastName: "Admin",
        email: "admin@clinic.local",
        password: "Admin@123",
      });

    assert.equal(bootstrapAdmin.status, 201);
    assert.equal(bootstrapAdmin.body.user.role, "admin");

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@clinic.local",
      password: "Admin@123",
    });

    assert.equal(adminLogin.status, 200);
    assert.ok(adminLogin.body.token);
    adminToken = adminLogin.body.token;
  });

  it("allows only admin to register receptionist and doctor", async () => {
    const denied = await request(app).post("/api/auth/signup").send({
      firstName: "No",
      lastName: "Auth",
      email: "unauth@clinic.local",
      password: "NoAuth@123",
      role: "receptionist",
    });

    assert.equal(denied.status, 401);

    const receptionistSignup = await request(app)
      .post("/api/auth/signup")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Reception",
        lastName: "One",
        email: "reception1@clinic.local",
        password: "Reception@123",
        role: "receptionist",
      });

    assert.equal(receptionistSignup.status, 201);
    assert.equal(receptionistSignup.body.user.role, "receptionist");

    const doctorSignup = await request(app)
      .post("/api/auth/signup")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Doctor",
        lastName: "One",
        email: "doctor1@clinic.local",
        password: "Doctor@123",
        role: "doctor",
        specialization: "Orthodontics",
      });

    assert.equal(doctorSignup.status, 201);
    assert.equal(doctorSignup.body.user.role, "doctor");

    const doctor = await Doctor.findOne().lean();
    assert.ok(doctor);
    doctorId = String(doctor._id);
  });

  it("logs in receptionist and doctor and receives tokens", async () => {
    const receptionistLogin = await request(app).post("/api/auth/login").send({
      email: "reception1@clinic.local",
      password: "Reception@123",
    });

    assert.equal(receptionistLogin.status, 200);
    assert.ok(receptionistLogin.body.token);
    receptionistToken = receptionistLogin.body.token;

    const doctorLogin = await request(app).post("/api/auth/login").send({
      email: "doctor1@clinic.local",
      password: "Doctor@123",
    });

    assert.equal(doctorLogin.status, 200);
    assert.ok(doctorLogin.body.token);
    doctorToken = doctorLogin.body.token;
  });

  it("allows receptionist to register patient", async () => {
    const registerPatient = await request(app)
      .post("/api/patients")
      .set("Authorization", `Bearer ${receptionistToken}`)
      .send({
        firstName: "Patient",
        lastName: "One",
        phone: "0712345678",
        age: 29,
        gender: "female",
      });

    assert.equal(registerPatient.status, 201);
    assert.ok(registerPatient.body.patient._id);
    patientId = registerPatient.body.patient._id;
  });

  it("if patient exists, receptionist can auto-assign available doctor", async () => {
    const assignExisting = await request(app)
      .post("/api/patients")
      .set("Authorization", `Bearer ${receptionistToken}`)
      .send({
        firstName: "Patient",
        lastName: "One",
        phone: "0712345678",
        age: 29,
        gender: "female",
      });

    assert.equal(assignExisting.status, 200);
    assert.equal(assignExisting.body.patient._id, patientId);
    assert.ok(assignExisting.body.patient.assignedDoctor);
  });

  it("lists doctors for receptionist", async () => {
    const listDoctors = await request(app)
      .get("/api/doctors")
      .set("Authorization", `Bearer ${receptionistToken}`);

    assert.equal(listDoctors.status, 200);
    assert.ok(Array.isArray(listDoctors.body.doctors));
    assert.ok(listDoctors.body.doctors.length > 0);
  });

  it("allows receptionist to appoint doctor to patient", async () => {
    const appoint = await request(app)
      .patch(`/api/patients/${patientId}/appoint-doctor`)
      .set("Authorization", `Bearer ${receptionistToken}`)
      .send({ doctorId });

    assert.equal(appoint.status, 200);
    assert.equal(String(appoint.body.patient.assignedDoctor._id), doctorId);
  });

  it("denies receptionist from adding medical record", async () => {
    const denied = await request(app)
      .post(`/api/patients/${patientId}/medical-records`)
      .set("Authorization", `Bearer ${receptionistToken}`)
      .send({
        diagnosis: "Test diagnosis",
        serviceFee: 100,
      });

    assert.equal(denied.status, 403);
  });

  it("allows assigned doctor to add diagnosis and prescription", async () => {
    const addRecord = await request(app)
      .post(`/api/patients/${patientId}/medical-records`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        diagnosis: "Dental cavity",
        treatment: "Tooth filling",
        prescription: [
          { medicine: "Ibuprofen", dosage: "200mg", duration: "3 days" },
        ],
        serviceFee: 250,
        notes: "Follow up after one week",
      });

    assert.equal(addRecord.status, 201);
    assert.equal(addRecord.body.medicalRecord.diagnosis, "Dental cavity");
    assert.equal(addRecord.body.medicalRecord.serviceFee, 250);
    assert.ok(Array.isArray(addRecord.body.medicalRecord.prescription));
  });

  it("allows doctor to read previous medical history", async () => {
    const history = await request(app)
      .get(`/api/patients/${patientId}/medical-records`)
      .set("Authorization", `Bearer ${doctorToken}`);

    assert.equal(history.status, 200);
    assert.ok(Array.isArray(history.body.medicalHistory));
    assert.ok(history.body.medicalHistory.length >= 1);
    assert.equal(history.body.recordsCount, history.body.medicalHistory.length);
  });
});
