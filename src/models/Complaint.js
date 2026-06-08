import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    
    name: {
      type: String,
      required: true
    },

    // 👇 شغال ايه
    jobTitle: {
      type: String,
      required: true,
      trim: true
    },

    // 👇 عنوان الشكوى
    reportTitle: {
      type: String,
      required: true,
      trim: true
    },

    // 👇 تفاصيل الشكوى
    reportDetails: {
      type: String,
      required: true
    },

    // رد الادمن
    reply: {
      type: String
    },

    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);