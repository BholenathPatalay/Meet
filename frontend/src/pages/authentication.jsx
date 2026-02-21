import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import SignIn from "../components/SignIn.jsx";
import SignUp from "../components/SignUp.jsx";
import BackgroundWrapper from "../components/BackgroundWrapper";

const Authentication = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  const [isSignIn, setIsSignIn] = useState(true);

  useEffect(() => {
    setIsSignIn(mode !== "register");
  }, [mode]);

  return (
    <BackgroundWrapper>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white">
              {isSignIn ? "Welcome Back" : "Join Meet"}
            </h1>
            <p className="text-gray-200 mt-2">
              {isSignIn
                ? "Sign in to continue"
                : "Create your account and start connecting"}
            </p>
          </div>

          {/* Tabs with sliding indicator */}
          <div className="relative mb-2 bg-white/20 p-1 rounded-xl">
            {/* Sliding pill */}
            <div
              className={`absolute top-1 left-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)]
              bg-white rounded-lg transition-transform duration-500 ease-in-out
              ${isSignIn ? "translate-x-0" : "translate-x-full"}`}
            />

            <div className="relative flex">
              <button
                onClick={() => setIsSignIn(true)}
                className={`flex-1 py-2 rounded-lg z-10 transition-colors duration-300
                  ${isSignIn ? "text-blue-600" : "text-white"}`}
              >
                Sign In
              </button>

              <button
                onClick={() => setIsSignIn(false)}
                className={`flex-1 py-2 rounded-lg z-10 transition-colors duration-300
                  ${!isSignIn ? "text-blue-600" : "text-white"}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Animated Forms */}
          <div className="relative overflow-hidden min-h-97.5">
            {/* Sign In */}
            <div
              className={`absolute w-full transition-all duration-500 ease-in-out
                ${
                  isSignIn
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-full opacity-0"
                }`}
            >
              <SignIn />
            </div>

            {/* Sign Up */}
            <div
              className={`absolute w-full transition-all duration-500 ease-in-out
                ${
                  !isSignIn
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0"
                }`}
            >
              <SignUp />
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default Authentication;
