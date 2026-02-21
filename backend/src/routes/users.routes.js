import { Router } from "express";
import {
  getUserHistory,
  addToHistory,
  login,
  register,
  updateUserName,
  changePassword,
  uploadAvatar,
  removeAvatar,
  deleteMeeting,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { upload } from "../services/cloudinary.js";
import multer from "multer";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);

router.route("/update_name").put(verifyToken, updateUserName);
router.route("/change_password").post(verifyToken, changePassword);

router.route("/remove_avatar").post(verifyToken, removeAvatar);
router.route("/add_to_activity").post(verifyToken, addToHistory);
router.route("/get_all_activity").get(verifyToken, getUserHistory);
router.route("/delete_meeting/:code").delete(verifyToken, deleteMeeting);

router.post(
  "/upload_avatar",
  verifyToken,
  upload.single("avatar"),
  uploadAvatar,
);
export default router;
