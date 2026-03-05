 import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (to, otp) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "Password Reset OTP",
    text: `Your OTP code is: ${otp}`,
  });
};





















// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendOTPEmail = async (to, otp) => {
//   await transporter.sendMail({
//     from: `"Smart Attendance" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: "Password Reset OTP",
//     text: `Your OTP code is: ${otp}`,
//   });
// };