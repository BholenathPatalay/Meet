import React, { useState } from "react";
import { Link } from "react-router-dom";
import BackgroundWrapper from "../components/BackgroundWrapper";
import JoinGuestModal from "../components/JoinGuestModal";

export default function Landing() {
  const [showModal, setShowModal] = useState(false);

  return (
    <BackgroundWrapper>
      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 right-0 px-4 py-3 sm:px-6 md:px-8 lg:px-12 flex justify-between items-center">
        <Link to="/" className="logo flex items-center gap-2">
          <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-medium">
            Meet
          </h2>
        </Link>

        <div className="flex gap-3 sm:gap-4 md:gap-6 items-center text-xs sm:text-sm md:text-base">
          <button
            onClick={() => setShowModal(true)}
            className="text-white hover:text-blue-300 transition"
          >
            Join as Guest
          </button>

          <JoinGuestModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
          />

          <Link
            to="/auth?mode=register"
            className="hidden sm:block text-white hover:text-blue-300 transition whitespace-nowrap"
          >
            Register
          </Link>

          <Link
            to="/auth?mode=login"
            className="bg-blue-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-blue-600 transition whitespace-nowrap"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* MAIN SECTION */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 pb-8 sm:pb-12 md:pb-16 lg:pb-20 xl:pb-24 gap-8">
        {/* TEXT */}
        <div className="text-center sm:text-left max-w-lg md:max-w-xl lg:max-w-2xl order-2 sm:order-1">
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
            <span className="text-blue-400 sm:text-blue-500">Connect</span> with
            your loved ones.
          </h1>

          <p className="text-gray-100 mt-3 sm:mt-4 md:mt-5 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed">
            Cover a distance with a click. Meet is a video calling app that
            brings you closer to your loved ones.
          </p>

          {/* Mobile CTA */}
          <div className="mt-6 md:hidden">
            <Link
              to="/auth?mode=login"
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition inline-block"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* IMAGE */}
        <div className="flex justify-center order-1 sm:order-2">
          <img
            src="/mobile.png"
            alt="Mobile Preview"
            className="h-[30vh] sm:h-[40vh] md:h-[45vh] lg:h-[50vh] xl:h-[55vh] object-contain"
            loading="lazy"
          />
        </div>
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:flex justify-center pb-12">
        <Link
          to="/auth?mode=login"
          className="bg-blue-500 text-white px-10 py-4 rounded-md hover:bg-blue-600 transition shadow-lg"
        >
          Start Connecting Now
        </Link>
      </div>
    </BackgroundWrapper>
  );
}
