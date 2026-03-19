# Clinic Management API

A role-based internal clinic backend built with Node.js, Express, and MongoDB.

This API is designed for internal staff use only:
- Admin manages internal users (receptionists and doctors)
- Receptionist onboards patients and assigns doctors
- Doctor reads patient medical history and writes new medical records

Patients do not log in to this system.

## Tech Stack

- Runtime: Node.js
- Framework: Express 5
- Database: MongoDB with Mongoose
- Authentication: JWT (jsonwebtoken)
- Password Hashing: bcrypt
- Environment Config: dotenv
- Testing: Node test runner + supertest + mongodb-memory-server

## Project Structure

- index.js: server entry point
- app.js: express app factory
- configs/: env and mongodb configuration
- controllers/: business logic by role/module
- models/: mongoose schemas
- middlewares/: auth and role guards
- routes/: endpoint definitions
- scripts/seed.js: seed initial data
- tests/workflow.test.js: integration tests

## Roles and Access Model

Internal roles:
- admin
- receptionist
- doctor

Access rules:
- Only admin can register receptionist and doctor users
- Receptionist can add patients and assign doctors
- Doctor can read/write medical records only for assigned patients
- Admin can access doctor medical-record endpoints as well
- Patients are not authenticated users in this internal system

## Core Workflow

### 1) Bootstrap Admin (one-time)
- Create the very first admin account with /api/auth/bootstrap-admin
- This endpoint is disabled once any user exists

### 2) Admin Creates Internal Staff
- Admin logs in and gets JWT token
- Admin uses /api/auth/signup to register:
  - receptionist
  - doctor (doctor profile is auto-created)

### 3) Receptionist Onboards Patients
- Receptionist logs in and gets JWT token
- Receptionist can:
  - Add a brand new patient
  - If patient exists (by phone), auto-assign available doctor
  - Appoint a specific doctor to a patient

### 4) Doctor Consultation Flow
- Doctor logs in and gets JWT token
- Doctor reads previous medical history for assigned patient
- Doctor writes current diagnosis/treatment/prescription as a new medical record

## Environment Variables

Create a .env file in the project root with:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=optional_email_user
EMAIL_PASS=optional_email_password

## Setup and Run

1. Install dependencies

npm install

2. Run in development

npm run dev

3. Run in production mode

npm start

4. Seed database (optional, for quick local testing)

npm run seed

5. Run tests

npm test

## Authentication

Protected routes require Authorization header:

Authorization: Bearer <jwt_token>

## API Documentation

Base URL (local):

http://localhost:5000

### Health

#### GET /
- Description: API health check
- Auth: No
- Response 200: plain text

Dental Clinic API is running

## Auth Endpoints

### POST /api/auth/bootstrap-admin
- Description: Create first admin user (one-time only)
- Auth: No
- Body:
{
  "firstName": "System",
  "lastName": "Admin",
  "email": "admin@clinic.local",
  "password": "Admin@123"
}
- Success 201: admin user created
- Errors:
  - 400 missing email/password
  - 403 bootstrap disabled if users already exist

### POST /api/auth/login
- Description: Login internal user and return JWT
- Auth: No
- Body:
{
  "email": "admin@clinic.local",
  "password": "Admin@123"
}
- Success 200:
{
  "message": "Login successful",
  "token": "...",
  "user": {
    "id": "...",
    "firstName": "System",
    "lastName": "Admin",
    "email": "admin@clinic.local",
    "role": "admin"
  }
}
- Errors:
  - 400 missing email/password
  - 401 invalid credentials
  - 403 non-internal role denied

### POST /api/auth/signup
- Description: Register internal user (admin only)
- Auth: Yes (admin)
- Body (receptionist example):
{
  "firstName": "Front",
  "lastName": "Desk",
  "email": "reception@clinic.local",
  "password": "Reception@123",
  "role": "receptionist"
}
- Body (doctor example):
{
  "firstName": "Sam",
  "lastName": "Dent",
  "email": "doctor@clinic.local",
  "password": "Doctor@123",
  "role": "doctor",
  "specialization": "General Dentistry"
}
- Success 201: user created
- Errors:
  - 400 invalid role or missing email/password
  - 401 unauthorized (missing token)
  - 403 forbidden (not admin)
  - 409 email already exists

### POST /api/auth/password-reset/request-otp
- Description: Generate a random 6-digit OTP and send it by email for password reset
- Auth: No
- Allowed roles: doctor, receptionist
- Body:
{
  "email": "reception@clinic.local"
}
- Success 200:
{
  "message": "Password reset OTP sent successfully",
  "expiresInMinutes": 10
}
- Errors:
  - 400 email missing
  - 404 user not found or role not eligible

### POST /api/auth/password-reset/verify-otp
- Description: Verify the OTP before resetting password
- Auth: No
- Allowed roles: doctor, receptionist
- Body:
{
  "email": "reception@clinic.local",
  "otp": "123456"
}
- Success 200:
{
  "message": "OTP verified successfully"
}
- Errors:
  - 400 invalid OTP or expired OTP

### POST /api/auth/password-reset/reset
- Description: Reset password using valid OTP
- Auth: No
- Allowed roles: doctor, receptionist
- Body:
{
  "email": "reception@clinic.local",
  "otp": "123456",
  "newPassword": "Reception@456"
}
- Success 200:
{
  "message": "Password reset successful"
}
- Errors:
  - 400 missing fields
  - 400 invalid OTP or expired OTP
  - 400 newPassword less than 6 characters

## Receptionist Endpoints

### POST /api/patients
- Description:
  - Create new patient if phone does not exist
  - If patient exists by phone, assign available/specified doctor
- Auth: Yes (receptionist or admin)
- Body (new patient):
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "0712345678",
  "age": 30,
  "gender": "female",
  "additionalInfo": "N/A"
}
- Body (existing patient assignment):
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "0712345678",
  "doctorId": "<optional_doctor_id>"
}
- Success:
  - 201 patient created
  - 200 existing patient found and doctor assigned
- Errors:
  - 400 missing firstName/lastName/phone
  - 404 no available doctor for existing patient assignment

### PATCH /api/patients/:patientId/appoint-doctor
- Description: Assign a doctor to a patient
- Auth: Yes (receptionist or admin)
- Params:
  - patientId
- Body:
{
  "doctorId": "<optional_doctor_id>"
}
- Notes:
  - If doctorId is omitted, system auto-selects available doctor
- Success 200: doctor assigned
- Errors:
  - 404 patient not found
  - 404 doctor not found / no available doctors

## Doctor Endpoints

### GET /api/doctors
- Description: List all doctors
- Auth: Yes (receptionist, doctor, admin)
- Success 200:
{
  "doctors": [
    {
      "_id": "...",
      "specialization": "General Dentistry",
      "assignedPatientsCount": 1,
      "user": {
        "firstName": "Sam",
        "lastName": "Dent",
        "email": "doctor@clinic.local",
        "role": "doctor"
      }
    }
  ]
}

### GET /api/patients/:patientId/medical-records
- Description: Read patient medical history
- Auth: Yes (doctor or admin)
- Access:
  - doctor: only assigned patients
  - admin: allowed
- Success 200:
{
  "patient": { ... },
  "recordsCount": 2,
  "medicalHistory": [ ... ]
}
- Errors:
  - 403 doctor not assigned to patient
  - 404 patient not found

### POST /api/patients/:patientId/medical-records
- Description: Add current diagnosis/medical record
- Auth: Yes (doctor or admin)
- Access:
  - doctor: only assigned patients
  - admin: allowed
- Body:
{
  "diagnosis": "Dental cavity",
  "treatment": "Tooth filling",
  "prescription": [
    {
      "medicine": "Ibuprofen",
      "dosage": "200mg",
      "duration": "3 days"
    }
  ],
  "serviceFee": 250,
  "notes": "Follow up after one week"
}
- Success 201: medical record created
- Errors:
  - 400 diagnosis/serviceFee missing
  - 403 doctor not assigned to patient
  - 404 patient not found

## Seeded Credentials (npm run seed)

The seed script creates/updates:
- Admin: admin@clinic.local / Admin@123
- Receptionist: reception@clinic.local / Reception@123
- Doctor: doctor@clinic.local / Doctor@123
- Sample patient: John Doe

## Testing Coverage

Current integration tests verify:
- Admin bootstrap and login
- Admin-only staff registration
- Receptionist login and patient onboarding
- Existing patient auto-assignment
- Doctor listing
- Doctor appointment flow
- Receptionist forbidden from doctor-only write endpoint
- Doctor writes medical record for assigned patient
- Doctor reads previous medical history
- Receptionist password reset with OTP (request, verify, reset, login with new password)

Run:

npm test

## Notes

- This API currently has no API version prefix; all routes are under /api except health.
- Configure JWT_SECRET and MONGODB_URI before running.
- For production, use secure secrets and HTTPS.
