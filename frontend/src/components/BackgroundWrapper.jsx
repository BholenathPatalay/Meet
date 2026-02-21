import React from "react";

const BackgroundWrapper = ({ children }) => {
  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 sm:bg-black/20" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default BackgroundWrapper;
