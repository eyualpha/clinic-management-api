const PasswordResetOtpEmail = (otp) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset Code</title>
    <style>
      body {
        font-family: 'Helvetica', Arial, sans-serif;
        background-color: #f4f4f7;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        padding: 20px;
        background-color: #1a73e8;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
        font-size: 16px;
        color: #333333;
        line-height: 1.6;
      }
      .otp-box {
        background-color: #f1c40f;
        padding: 15px;
        text-align: center;
        font-size: 26px;
        font-weight: bold;
        color: #000000;
        border-radius: 5px;
        letter-spacing: 4px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #888888;
        padding: 20px;
        border-top: 1px solid #e4e4e4;
      }
      @media screen and (max-width: 600px) {
        .container {
          width: 90%;
        }
        .otp-box {
          font-size: 22px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>ASTUECSF CHOIR</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset the password for your account. Use the code below to continue.</p>
        <div class="otp-box">${otp}</div>
        <p>This code expires in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ASTUECSF CHOIR. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};

export default {
  PasswordResetOtpEmail,
};
