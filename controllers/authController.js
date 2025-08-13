import { registerSchema } from "../validation/createUser.js";
import prisma from "../connection/db.js";
import { formatZodErrors } from "../utils/appError.js";

const loginController = (req, res) => {
  res.send("this is login controller");
};

// Sign Up Controller
const signupController = async (req, res, next) => {
  const userData = registerSchema.safeParse(req.body);
  if (!userData.success) {
    return res.status(400).send({
      status: "failed",
      message: formatZodErrors(userData.error),
    });
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
    next(error);
  }
};
export { loginController, signupController };
