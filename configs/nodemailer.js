import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS } from "./env.js";

require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});
export default transporter;
