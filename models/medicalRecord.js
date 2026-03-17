import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    diagnosis: {
      type: String,
      required: true,
    },

    treatment: String,

    prescription: [
      {
        medicine: String,
        dosage: String,
        duration: String,
      },
    ],

    serviceFee: {
      type: Number,
      required: true,
    },

    notes: String,
  },
  { timestamps: true },
);

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
