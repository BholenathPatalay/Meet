import React, { useState } from "react";

const OutlinedInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
  rightIcon,
  onRightIconClick,
  placeholder,
  className = "",
}) => {
  const [focused, setFocused] = useState(false);

  const showLabel = focused || value;

  return (
    <div className="relative w-full">
      {/* Floating border label */}
      <span
        className={`
          absolute -top-2.5 left-9 px-1 text-xs font-medium
          transition-all duration-500 ease-in  bg-transparent
          ${showLabel ? "opacity-100 scale-100" : "opacity-0 scale-95"}
          ${focused ? "text-blue-400" : "text-gray-400"}
        `}
      >
        {label}
      </span>

      <div className="relative">
        {/* Left icon */}
        {Icon && (
          <span
            className={`
              absolute left-3 top-1/2 -translate-y-1/2
              transition-all duration-500
              ${focused ? "text-blue-400" : "text-gray-400"}
            `}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={!showLabel ? label : placeholder}
          className={`
            w-full h-10
            pl-10 pr-10 
            text-sm sm:text-base  
            bg-transparent
            rounded-md
            outline-none
            border-none
            transition-all duration-500
            placeholder:text-gray-500 placeholder:transition-all
            ${className}
          `}
        />

        <span
          className={`
            absolute left-0 bottom-0 w-full
            transition-all duration-500
            ${focused ? "h-0.5 bg-blue-400" : "h-px bg-white/30"}
          `}
        />

        {/* Right icon */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              transition-all duration-500
              ${focused ? "text-blue-400" : "text-gray-400"}
              hover:text-blue-300 active:scale-95
            `}
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
};

export default OutlinedInput;
