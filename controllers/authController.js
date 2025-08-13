import { registerSchema } from "../validation/createUser.js";
import prisma from "../connection/db.js";
import { formatZodErrors } from "../utils/appError.js";
import bcrypt from "bcrypt";
import { loginUser } from "../validation/loginUser.js";
import jwt from "jsonwebtoken";

const loginController = async (req, res, next) => {
  const userData = loginUser.safeParse(req.body);
  if (!userData.success) {
    return res.status(400).json({
      status: "failed",
      message: formatZodErrors(userData.error),
    });
  }

  try {
    const { email, password } = userData.data;
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!existingUser) {
      return next(new AppError("No User Found", 401));
    }
    const validPassword = bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      return next(new AppError("Incorrect Password!", 401));
    }

    const accessToken = jwt.sign(
      { userId: existingUser.id, role: existingUser.role }, // payload
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }, // short-lived
    );

    const refreshToken = jwt.sign(
      { userId: existingUser.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }, // longer-lived
    );
    const tokenData = await prisma.authtoken.create({
      data: {
        accessToken,
        refreshToken,
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return res
      .status(200)
      .json({ data: tokenData, message: "Login Successfully!" });
  } catch (error) {
    next(error);
  }
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
