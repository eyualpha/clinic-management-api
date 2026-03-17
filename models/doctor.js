import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    specialization: String,

    assignedPatientsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
