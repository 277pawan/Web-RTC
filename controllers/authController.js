import prisma from "../connection/db";
import { registerSchema } from "../validation/createUser";
import AppError from "../utils/appError";

const loginController = (req, res) => {
  res.send("this is login controller");
};

// Sign Up Controller
const signupController = async (req, res, next) => {
  const userData = registerSchema.safeParse(req.body);
  if (!userData.success) {
    return next(new AppError("Validation failed", 400));
  }

  try {
    const { name, email, password } = userData.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    res
      .status(201)
      .json({ data: user, message: "Account created successfully!" });
  } catch (error) {
    next(error); // passes the error to the global error handler
  }
};
export { loginController, signupController };
