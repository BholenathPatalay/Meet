import bcrypt from "bcrypt";
import crypto from "crypto";
import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";

/* REGISTER  */
const register = async (req, res) => {
  let { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (err) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

/* LOGIN  */
const login = async (req, res) => {
  let { email, password } = req.body;

  email = email?.trim();

  if (!email || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Email/Username and password are required" });
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

const updateUserName = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Name is required" });
  }

  try {
    req.user.name = name;
    await req.user.save();
    res
      .status(httpStatus.OK)
      .json({ name: req.user.name, message: "Name updated successfully" });
  } catch (e) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: e.message });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Passwords do not match" });
  }

  if (newPassword.length < 8) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Password must be at least 8 characters" });
  }

  try {
    const user = req.user;
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res
      .status(httpStatus.OK)
      .json({ message: "password updated successfully" });
  } catch (e) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: e.message });
  }
};

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "NO file uploaded" });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = req.file.path || req.file.secure_url;

    req.user.avatar = avatarUrl;
    await req.user.save();
    res.status(200).json({ avatarUrl });
  } catch (err) {
    console.error("Upload controller error:", err); // Log full error
    res.status(500).json({ message: err.message });
  }
};

const removeAvatar = async (req, res) => {
  try {
    req.user.avatar = "";
    await req.user.save();
    res.status(httpStatus.OK).json({ message: "Avatar removed successfully" });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e.message });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const meetings = await Meeting.find({ user_id: req.user._id });
    res.json(meetings);
  } catch (e) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: `Something went wrong ${e.message}` });
  }
};

const addToHistory = async (req, res) => {
  const { meetingCode } = req.body;
  try {
    const newMeeting = new Meeting({
      user_id: req.user._id,
      meetingCode,
    });
    await newMeeting.save();
    res.status(httpStatus.CREATED).json({ message: "added code to history" });
  } catch (e) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: `Something went wrong ${e.message}` });
  }
};

const deleteMeeting = async (req, res) => {
  const meetingCode = req.params.code;
  try {
    const meeting = await Meeting.findOneAndDelete({
      user_id: req.user._id,
      meetingCode,
    });
    res.status(httpStatus.OK).json({ message: "Meeting deleted successfully" });
  } catch (e) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: `Something went wrong ${e.message}` });
  }
};

export {
  register,
  login,
  changePassword,
  updateUserName,
  uploadAvatar,
  removeAvatar,
  getUserHistory,
  addToHistory,
  deleteMeeting,
};
