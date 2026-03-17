import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ["male", "female", "other"] },

  // Reference to the User account
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
  },

  additionalInfo: String,
});

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
