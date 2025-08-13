// utils/sendError.js
export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    statusCode: statusCode,
    message,
  });
};
