import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import ProfileModal from "./ProfileModal";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuthStore();

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  return (
    <>
      <nav className="bg-neutral-primary w-full start-0 border-b border-default sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <div className="max-w-7.5xl flex flex-wrap items-center justify-between mx-auto p-4">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2">
            <Video size={30} className="text-blue-700 mt-0.5" />
            <h1 className="self-center text-2xl font-bold whitespace-nowrap ">
              Meet
            </h1>
          </Link>

          {/* avatar */}
          <div className="flex items-center md:order-2 space-x-2">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex text-sm bg-neutral-primary rounded-full focus:ring-2 focus:ring-neutral-tertiary p-1.5"
                aria-expanded={isDropdownOpen}
              >
                <img
                  src={user?.avatar || "/user.png"}
                  className="h-8 w-8 object-cover rounded-full"
                  alt="user avatar"
                />
              </button>

              {/* dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg z-50">
                  <div className="px-4 py-3 text-sm border-b border-default">
                    <span className="block text-heading font-medium uppercase">
                      {user?.name || "User"}
                    </span>
                    <span className="block text-body text-xs truncate">
                      {user?.email || "Email"}
                    </span>
                  </div>
                  <ul className="p-2 text-sm text-body font-medium">
                    <li>
                      <button
                        onClick={openProfileModal}
                        className="block w-full text-left p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded"
                      >
                        Profile
                      </button>
                    </li>

                    <li>
                      <span
                        onClick={handleLogout}
                        className="block p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded cursor-pointer"
                      >
                        Logout
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ProfileModal isOpen={isProfileModalOpen} onClose={closeProfileModal} />
    </>
  );
};

export default Navbar;
