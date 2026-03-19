import transporter from "../configs/nodemailer.js";
import { PasswordResetOtpEmail } from "./emailTemplates.js";

import { EMAIL_PASS, EMAIL_USER } from "../configs/env.js";

export const sendResetOtpEmail = async (email, otp) => {
  if (!EMAIL_USER || !EMAIL_PASS || process.env.NODE_ENV === "test") {
    // Skip real SMTP in test or when credentials are not configured.
    return true;
  }

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
