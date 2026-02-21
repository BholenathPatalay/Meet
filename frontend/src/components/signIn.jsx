import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import OutlinedInput from "../components/OutlinedInput";
import { useAuthStore } from "../store/useAuthStore";

const SignIn = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center space-y-8 mt-4"
    >
      {/* Inputs */}
      <div className="w-full space-y-6">
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
          rightIcon={
            showPassword ? (
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
            )
          }
          onRightIconClick={() => setShowPassword((p) => !p)}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60
        text-white py-3 rounded-md font-medium flex items-center justify-center gap-2 transition"
      >
        <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
        {loading ? "Signing in..." : "Sign In"}
      </button>

      {/* Footer */}
      <div className="text-center space-y-3">
        <p className="text-white/70 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            to="/auth?mode=register"
            className="text-blue-300 hover:text-blue-200 font-medium"
          >
            Sign up
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

export default SignIn;
