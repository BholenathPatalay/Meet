import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, LogIn, PlusCircle } from "lucide-react";

export default function JoinGuestModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const createMeeting = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    navigate(`${code}`);
  };

  const joinMeeting = () => {
    if (!meetingCode.trim()) return;
    navigate(`${meetingCode}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop:blur-lg z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-[#0b0f2a] w-full max-w-md p-6 rounded-2xl border border-white/20 text-white relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-white/60 hover:text-white"
                >
                  <X />
                </button>
                <h2 className="text-2xl font-semibold mb-6">Join as Guest</h2>

                <button
                  onClick={createMeeting}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg mb-4 transition-all duration-75 shadow-md hover:shadow-lg flex-1 group"
                >
                  <PlusCircle className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                  <span className="text-lg">New meeting</span>
                </button>

                <div className="text-center text-white/40 mb-4">or</div>

                <input
                  type="text"
                  placeholder="Enter Meeting Code"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-lg mb-3"
                />
                <button
                  onClick={joinMeeting}
                  className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 py-3 rounded-lg transition-all duration-75"
                >
                  <LogIn size={20} />
                  <span>Join Meeting</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
