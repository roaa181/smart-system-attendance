import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const employeeSchema = new mongoose.Schema(
  {
    employeeNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, trim: true },
    password: { type: String, required: true },

    //  FIX: role لوحده، otp و otpExpires خارج منه
    role: {
      type: String,
      enum: ["employee", "security", "admin"],
      default: "employee",
    },

    // FIX: اتنقلوا لبره role
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },

    faceId: { type: String, unique: true, sparse: true },
    cardNumber: { type: String, unique: true, sparse: true },
    qr_code: { type: String, default: null },
    qr_expires: { type: Date, default: null },

    tokens: [
      {
        token: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// ─────────────────────────────────────────
//   توليد رقم الموظف تلقائيًا
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
//   تشفير الباسورد قبل الحفظ
// ─────────────────────────────────────────
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─────────────────────────────────────────
//   methods
// ─────────────────────────────────────────
employeeSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

employeeSchema.methods.generateAuthToken = async function () {
  const token = jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  this.tokens.push({ token });
  await this.save();
  return token;
};

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
// ////////////////////////////////////////////////////////////////
// import mongoose from "mongoose";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";



// const employeeSchema = new mongoose.Schema({
   
//    employeeNumber: { type: String, required: true, unique: true },
//    name:  { type: String, required:true, trim: true },// trim to remove whitespace يعني بتشيل المسافات قبل وبعد الاسم
//    email: { type: String, unique: true , trim: true },
//    password:  { type: String, required: true },
//    role: {
//     type: String,
//    enum: ["employee", "security"],
//     //  زي منيو مطعم enumeration //
//     // اختار طبق من اللي موجود
//     // مش اطلب حاجة من دماغي
//     otp: String,
//     otpExpires: Date,
//     default: "employee",
//    },
//    faceId: { type: String,  unique: true, sparse: true }, // sparse عشان يسمح بقيم null
//    cardNumber: { type: String, unique: true, sparse: true }, // sparse عشان يسمح بقيم null
//     // hasParkingAccess: { type: Boolean, default: false }, // صلاحية دخول الباركنج
  

//    qr_code: String,
//       tokens: [
//     {
//       token: {
//         type: String,
//         required: true
//       }
//     }
//   ]

  
// }, { timestamps: true });

// //////////////////////////////////////////////////////////////
// //                        توليد رقم الموظف تلقائيًا عند إنشاء موظف جديد
// employeeSchema.pre("validate", async function (next) {
//   if (this.employeeNumber) return next();

//   const lastEmployee = await mongoose
//     .model("Employee")
//     .findOne()
//     .sort({ createdAt: -1 });

//   let newNumber = "EMP0001";

//   if (lastEmployee?.employeeNumber) {
//     const lastNum = parseInt(lastEmployee.employeeNumber.slice(3));
//     newNumber = `EMP${String(lastNum + 1).padStart(4, "0")}`;
//   }

//   this.employeeNumber = newNumber;
//   next();
// });


// // ////////////////////////////////////////////////////////////
// employeeSchema.pre("save", async function(next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(8);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// employeeSchema.methods.comparePassword = async function(password) {
//   return await bcrypt.compare(password, this.password);
// };
// // تشفير كلمة المرور قبل حفظها في قاعدة البيانات

  

// /////////////////////////////////////////////////////////////

// employeeSchema.methods.generateAuthToken = async function () {
//   const employee = this;

//   const token = jwt.sign(
//     { id: employee._id, role: employee.role },
//     process.env.JWT_SECRET,
//     { expiresIn: "1d" }
//   );

//   employee.tokens.push({ token });
//   await employee.save();

//   return token;
// };



// const Employee = mongoose.model("Employee", employeeSchema);
// export default Employee;
// // تصدير الموديل لاستخدامه في ملفات أخرى


