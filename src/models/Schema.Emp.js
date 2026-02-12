import mongoose from "mongoose";
import bcrypt from "bcrypt";


const employeeSchema = new mongoose.Schema({
   
   employeeNumber: { type: String, required: true, unique: true },
   name:  { type: String, required:true, trim: true },// trim to remove whitespace يعني بتشيل المسافات قبل وبعد الاسم
   email: { type: String, unique: true , trim: true },
   password:  { type: String, required: true },
   role: {
    type: String,
   enum: ["employee", "security"],
    //  زي منيو مطعم enumeration //
    // اختار طبق من اللي موجود
    // مش اطلب حاجة من دماغي
    default: "employee",
   },
   faceId: { type: String,  unique: true, sparse: true }, // sparse عشان يسمح بقيم null
   cardNumber: { type: String, unique: true, sparse: true }, // sparse عشان يسمح بقيم null
    // hasParkingAccess: { type: Boolean, default: false }, // صلاحية دخول الباركنج

   qr_code: String,

  
}, { timestamps: true });

//////////////////////////////////////////////////////////////
//                        توليد رقم الموظف تلقائيًا عند إنشاء موظف جديد
employeeSchema.pre("validate", async function (next) {
  if (this.employeeNumber) return next();

  const lastEmployee = await mongoose
    .model("Employee")
    .findOne()
    .sort({ createdAt: -1 });

  let newNumber = "EMP0001";

  if (lastEmployee?.employeeNumber) {
    const lastNum = parseInt(lastEmployee.employeeNumber.slice(3));
    newNumber = `EMP${String(lastNum + 1).padStart(4, "0")}`;
  }

  this.employeeNumber = newNumber;
  next();
});


// ////////////////////////////////////////////////////////////
employeeSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employeeSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};
// تشفير كلمة المرور قبل حفظها في قاعدة البيانات

  

/////////////////////////////////////////////////////////////

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
// تصدير الموديل لاستخدامه في ملفات أخرى


