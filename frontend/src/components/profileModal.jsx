import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { Camera } from "lucide-react";
import { api } from "../api/axios";
import ReactCrop, { makeAspectCrop, centerCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import setCanvasPreview from "../setCanvasPreview";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_AVATAR = "/user.png";

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();

  const ASPECT_RATIO = 1;
  const MIN_DIMENSION = 50;

  // View data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewEdit, setAvatarPreviewEdit] = useState(DEFAULT_AVATAR);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password change state
  const [passwordMode, setPasswordMode] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Crop state (stored in percent for responsiveness)
  const [crop, setCrop] = useState();
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const fileInputRef = useRef(null);

  // Populate view data when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarPreview(user.avatar || DEFAULT_AVATAR);
    }
  }, [user]);

  // Reset edit fields when entering edit mode
  useEffect(() => {
    if (editMode && user) {
      setEditName(user.name || "");
      setAvatarPreviewEdit(user.avatar || DEFAULT_AVATAR);
      setAvatarFile(null);
      setProfileError("");
      setCrop(undefined);
    }
  }, [editMode, user]);

  // Cleanup blob URL when preview changes
  useEffect(() => {
    return () => {
      if (avatarPreviewEdit && avatarPreviewEdit.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewEdit);
      }
    };
  }, [avatarPreviewEdit]);

  const handleClose = () => {
    setEditMode(false);
    setPasswordMode(false);
    onClose();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setProfileError("Please select a valid image (JPEG, PNG, JPG)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Image size must be less than 2MB");
      return;
    }

    setProfileError("");
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewEdit(previewUrl);
    setCrop(undefined);
  };

  // Remove avatar locally (will be applied on Save)
  const handleRemoveAvatar = () => {
    setAvatarPreviewEdit(DEFAULT_AVATAR);
    setAvatarFile(null);
    // Reset crop since there's no image to crop
    setCrop(undefined);
  };

  // Initialize crop when image loads
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: (MIN_DIMENSION / width) * 100,
        },
        ASPECT_RATIO,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(crop);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileError("Name cannot be empty");
      return;
    }

    setIsUpdatingProfile(true);
    setProfileError("");

    try {
      // 1. Update name on server and immediately reflect in UI
      const nameResponse = await api.put("/users/update_name", {
        name: editName,
      });
      const updatedUser = { ...user, name: nameResponse.data.name };
      setUser(updatedUser);

      // 2. Handle avatar changes (upload new or remove)
      if (avatarFile) {
        // Upload new avatar (with crop if available)
        if (crop && imgRef.current) {
          // Create a new image from the preview URL to get natural dimensions
          const image = new Image();
          image.src = avatarPreviewEdit;
          await new Promise((resolve) => {
            image.onload = resolve;
          });

          // Convert percent crop to pixel crop
          const pixelCrop = {
            x: (crop.x / 100) * image.naturalWidth,
            y: (crop.y / 100) * image.naturalHeight,
            width: (crop.width / 100) * image.naturalWidth,
            height: (crop.height / 100) * image.naturalHeight,
            unit: "px",
          };

          // Validate minimum crop size
          if (
            pixelCrop.width < MIN_DIMENSION ||
            pixelCrop.height < MIN_DIMENSION
          ) {
            setProfileError(
              `Crop must be at least ${MIN_DIMENSION}px on each side`,
            );
            setIsUpdatingProfile(false);
            return;
          }

          // Set up canvas
          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }
          const canvas = canvasRef.current;
          canvas.width = pixelCrop.width;
          canvas.height = pixelCrop.height;

          // Generate cropped image on canvas
          setCanvasPreview(image, canvas, pixelCrop);

          // Convert canvas to blob
          const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
              (b) => {
                if (!b) reject(new Error("Canvas is empty"));
                resolve(b);
              },
              "image/jpeg",
              0.95,
            );
          });
          if (!blob) throw new Error("Failed to create image blob");

          // Upload cropped blob
          const formData = new FormData();
          formData.append("avatar", blob, "avatar.jpg");
          const avatarResponse = await api.post(
            "/users/upload_avatar",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          updatedUser.avatar = avatarResponse.data.avatarUrl;
        } else {
          // No crop, upload original file
          const formData = new FormData();
          formData.append("avatar", avatarFile);
          const avatarResponse = await api.post(
            "/users/upload_avatar",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          updatedUser.avatar = avatarResponse.data.avatarUrl;
        }

        // Update user with new avatar URL
        setUser(updatedUser);
        setAvatarPreview(updatedUser.avatar);
      } else if (
        avatarPreviewEdit === DEFAULT_AVATAR &&
        user.avatar !== DEFAULT_AVATAR
      ) {
        // Avatar was removed – call remove endpoint
        await api.post("/users/remove_avatar");
        updatedUser.avatar = DEFAULT_AVATAR;
        setUser(updatedUser);
        setAvatarPreview(DEFAULT_AVATAR);
      }

      // If we get here, all changes succeeded
      setName(updatedUser.name);
      toast.success("Profile updated successfully");
      setEditMode(false);
    } catch (e) {
      setProfileError(e.response?.data?.message || "Failed to update profile");
      // Name change succeeded but avatar failed; user store already has new name,
      // but avatar remains old. This is acceptable and we show error.
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError("");

    try {
      await api.post("/users/change_password", { oldPassword, newPassword });
      toast.success("Password changed successfully");
      setPasswordMode(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-white/30 backdrop-blur-lg z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative p-4 w-full max-w-md max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-white border border-default rounded-base shadow-sm p-4 md:p-6">
            <button
              type="button"
              className="absolute top-3 end-2.5 text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center"
              onClick={handleClose}
            >
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18 17.94 6M18 18 6.06 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>

            <div className="p-4 md:p-5">
              {editMode ? (
                // Edit Profile Form
                <div>
                  <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

                  {/* Avatar Section with Crop */}
                  <div className="flex flex-col items-center mb-6">
                    {avatarPreviewEdit &&
                    avatarPreviewEdit !== DEFAULT_AVATAR ? (
                      <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        circularCrop
                        keepSelection
                        aspect={ASPECT_RATIO}
                        minWidth={MIN_DIMENSION}
                      >
                        <img
                          ref={imgRef}
                          src={avatarPreviewEdit}
                          alt="Avatar"
                          onLoad={onImageLoad}
                          className="w-64 h-64 object-contain"
                        />
                      </ReactCrop>
                    ) : (
                      <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-1"
                        disabled={isUpdatingProfile}
                      >
                        <Camera className="h-4 w-4" />
                        Change photo
                      </button>
                      {avatarPreviewEdit !== DEFAULT_AVATAR && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                          disabled={isUpdatingProfile}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Name Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isUpdatingProfile}
                    />
                  </div>

                  {profileError && (
                    <p className="text-sm text-red-600 mb-4">{profileError}</p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                      disabled={isUpdatingProfile}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isUpdatingProfile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                      {isUpdatingProfile ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : passwordMode ? (
                // Change Password Form
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Change Password
                  </h3>
                  <form onSubmit={handleChangePassword}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Old Password
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isUpdatingPassword}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isUpdatingPassword}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isUpdatingPassword}
                      />
                    </div>

                    {passwordError && (
                      <p className="text-sm text-red-600 mb-4">
                        {passwordError}
                      </p>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setPasswordMode(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                        disabled={isUpdatingPassword}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                      >
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // View Profile
                <div>
                  <div className="flex flex-col items-center mb-6">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-3"
                    />
                    <h3 className="text-xl font-semibold">{name}</h3>
                    <p className="text-gray-600">{email}</p>
                  </div>

                  <div className="flex items-center space-x-4 justify-center">
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 focus:outline-none"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setPasswordMode(true)}
                      className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary font-medium rounded-lg text-sm px-4 py-2.5 focus:outline-none"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileModal;
