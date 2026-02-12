// import Employee from "../models/Schema.Emp.js";

// export const assignCardToEmployee = async (req, res) => {
//   try {
//     const { employeeId, cardNumber } = req.body;

//     if (!employeeId || !cardNumber) {
//       return res.status(400).json({ message: "employeeId and cardNumber are required" });
//     }

//     // التأكد إن الكارت مش مستخدم قبل كده
//     const existingCard = await Employee.findOne({ cardNumber });
//     if (existingCard) {
//       return res.status(400).json({ message: "This card is already assigned to another employee" });
//     }

//     // تحديث الموظف
//     const updatedEmployee = await Employee.findByIdAndUpdate(
//       employeeId,
//       { cardNumber },
//       { new: true }
//     );

//     if (!updatedEmployee) {
//       return res.status(403).json({ message: "Employee not found" });
//     }

//     res.json({
//       message: "Card assigned successfully",
//       employee: updatedEmployee
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// ///////////////////////////////////////////////////////////////////////////

                                  //  card auto assignment //

import Employee from "../models/Schema.Emp.js";

export const assignCardAuto= async (req, res) => {
  try {
    const { cardNumber } = req.body;

    if (!cardNumber) {
      return res.status(400).json({
        message: "cardNumber is required"
      });
    }

    //  تأكد إن الكارت مش مستخدم
    const usedCard = await Employee.findOne({ cardNumber });
    if (usedCard) {
      return res.status(400).json({
        message: "Card already assigned"
      });
    }

    // هات أول موظف مالوش كارت
    const employee = await Employee.findOne({ cardNumber: null }).sort({ createdAt: 1 });

    if (!employee) {
      return res.status(404).json({
        message: "No available employee to assign card"
      });
    }

    // ربط الكارت
    employee.cardNumber = cardNumber;
    await employee.save();

    res.json({
      message: "Card assigned successfully",
      employeeId: employee._id,
      employeeNumber: employee.employeeNumber
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////////////////////////////////


 //                                         (إنشاء موظف جديد )


export const createEmployee = async (req, res) => {
  try {
    const { name } = req.body;

    const employee = new Employee({ name });
    await employee.save(); // هنا pre-save يشتغل

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};




