import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import OutlinedInput from "./OutlinedInput";
import { useAuthStore } from "../store/useAuthStore";

const SignUp = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register({
        name: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      navigate("/auth?mode=login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-2">
      <OutlinedInput
        id="fullName"
        label="Full Name"
        placeholder="John Doe"
        icon={User}
        value={form.fullName}
        onChange={handleChange}
        className="text-white"
      />

      <OutlinedInput
        id="email"
        label="Email Address"
        placeholder="john@example.com"
        icon={Mail}
        value={form.email}
        onChange={handleChange}
        className="text-white"
      />

      <OutlinedInput
        id="password"
        label="Password"
        icon={Lock}
        type={showPassword ? "text" : "password"}
        value={form.password}
        onChange={handleChange}
        className="text-white"
      />

      <OutlinedInput
        id="confirmPassword"
        label="Confirm Password"
        icon={CheckCircle}
        type={showPassword ? "text" : "password"}
        value={form.confirmPassword}
        onChange={handleChange}
        className="text-white"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60
        text-white py-3 rounded-md font-medium flex items-center justify-center gap-2 transition"
      >
        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <div className="text-center space-y-3">
        <p className="text-white/70 text-sm">
          Already have an account?{" "}
          <Link
            to="/auth?mode=login"
            className="text-blue-300 hover:text-blue-200 font-medium"
          >
            Sign in
          </Link>
        </p>

        <Link
          to="/"
          className="text-white/80 hover:text-white text-sm flex items-center justify-center gap-1"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    </form>
  );
};

export default SignUp;
