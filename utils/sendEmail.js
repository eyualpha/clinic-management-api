import transporter from "../configs/nodemailer.js";
import { PasswordResetOtpEmail } from "./emailTemplates.js";

import { EMAIL_USER } from "../configs/env.js";

const sendEmail = async (email, subject, text) => {
  const htmlContent = sendTemporaryPasswordEmail(subject, text);
  const mailOptions = {
    from: '"Dental Clinic" <' + EMAIL_USER + ">",
    to: email,
    subject: subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP email sent to ${email}`);

  return true;
};

const sendResetOtpEmail = async (email, otp) => {
  const htmlContent = PasswordResetOtpEmail(otp);
  const mailOptions = {
    from: '"Dental Clinic" <' + EMAIL_USER + ">",
    to: email,
    subject: "Your password reset code",
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Password reset OTP sent to ${email}`);

  return true;
};

module.exports = { sendEmail, sendResetOtpEmail };
