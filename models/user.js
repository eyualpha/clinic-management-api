import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: String,

    role: {
      type: String,
      enum: ["admin", "doctor", "patient"],
      required: true,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
