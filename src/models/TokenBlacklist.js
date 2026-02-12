import mongoose from "mongoose";

const tokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1d" } 
  // token هيتحذف تلقائي بعد يوم
});

export default mongoose.model("TokenBlacklist", tokenBlacklistSchema);
