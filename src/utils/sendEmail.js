import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Smart Attendance" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset OTP",
    text: `Your OTP code is: ${otp}`,
  });
};