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

export const sendNotificationEmail = async (to, subject, message) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    text: message,
  });
};
