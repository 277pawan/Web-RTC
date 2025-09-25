import { registerSchema } from "../validation/createUser.js";
import prisma from "../connection/db.js";
import { formatZodErrors } from "../utils/appError.js";
import bcrypt from "bcrypt";
import { loginUser } from "../validation/loginUser.js";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/sendError.js";

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
      return sendError(res, "User Not Found!", 401);
    }
    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      return sendError(res, "Incorrect Password!", 401);
    }

    const loginCount = await prisma.authtoken.count({
      where: {
        userId: existingUser.id,
      },
    });
    if (loginCount >= 5) {
      return res.status(400).json({
        status: "failed",
        message: "User already logged in 5 devices",
      });
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
    const { password: pwd, ...userWithoutPassword } = existingUser;
    const finalResponse = { ...userWithoutPassword, tokenData };
    return res
      .status(200)
      .json({ data: finalResponse, message: "Login Successfully!" });
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
      return sendError(res, "Email already in use!", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role }, // payload
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }, // short-lived
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }, // longer-lived
    );
    const tokenData = await prisma.authtoken.create({
      data: {
        accessToken,
        refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: pwd, ...userWithoutPassword } = user;
    const finalResponse = { ...userWithoutPassword, tokenData };
    res
      .status(201)
      .json({ data: finalResponse, message: "Account created successfully!" });
  } catch (error) {
    next(error);
  }
};

// refreshTokenController.js
const refreshTokenController = async (req, res, next) => {
  try {
    const { refreshToken, accessToken } = req.body;

    if (refreshToken) {
      const tokenRecord = await prisma.authtoken.findUnique({
        where: { refreshToken },
      });

      if (!tokenRecord) {
        return sendError(res, "Invalid refresh token", 401);
      }

      const accessToken = jwt.sign(
        { userId: tokenRecord.userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" },
      );

      const newRefreshToken = jwt.sign(
        { userId: tokenRecord.userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }, // longer-lived
      );

      // Option 1: Create new token row for multi-device
      const newToken = await prisma.authtoken.update({
        where: { id: tokenRecord.id },
        data: {
          userId: tokenRecord.userId,
          accessToken,
          refreshToken: newRefreshToken, // could also issue new refreshToken here
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(200).json({ token: newToken });
    } else {
      const authData = await prisma.authtoken.findUnique({
        where: { accessToken },
        select: {
          role: true,
          userId: true,
        },
      });
      const userData = await prisma.user.findUnique({
        where: { id: authData.userId },
      });
      const { password: pwd, ...userWithoutPassword } = userData;
      const finalResponse = userWithoutPassword;
      return res.status(200).json({
        data: finalResponse,
        message: "User data fetched successfully",
      });
    }
  } catch (error) {
    next(error);
  }
};

export { loginController, signupController, refreshTokenController };
