import { User } from "../models/user.model.js";
import httpStatus from "http-status";

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "No token provided" });
  }

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Token!" });
    }
    req.user = user;
    next();
  } catch (e) {
    console.log(e);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: e.message });
  }
};
