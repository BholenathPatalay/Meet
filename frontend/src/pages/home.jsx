import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../api/axios";
import Navbar from "../components/Navbar";
import {
  History,
  PlusCircle,
  ArrowRight,
  Calendar,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

const Home = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [meetingCode, setMeetingCode] = useState("");
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteCode, setDeleteCode] = useState(null);

  // Fetch meeting history from backend on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await api.get("/users/get_all_activity", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecentMeetings(response.data);
        setError("");
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError("Could not load meeting history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  const generateMeetingCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const addMeetingToHistory = async (code) => {
    if (!token) return;
    try {
      await api.post("/users/add_to_activity", { meetingCode: code });
      setRecentMeetings((prev) => [
        { meetingCode: code, date: new Date().toISOString() },
        ...prev,
      ]);
    } catch (err) {
      console.error("Failed to add meeting to history:", err);
    }
  };

  const handleNewMeeting = async () => {
    const newCode = generateMeetingCode();
    await addMeetingToHistory(newCode);
    navigate(`/${newCode}`);
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    if (!meetingCode.trim()) {
      alert("Please enter a meeting code");
      return;
    }
    const code = meetingCode.trim();
    await addMeetingToHistory(code);
    navigate(`/${code}`);
  };

  const joinFromHistory = (code) => {
    navigate(`/${code}`);
  };

  const handleDeleteMeeting = (code) => {
    setDeleteCode(code);
  };

  const handleTransitionEnd = async (code) => {
    if (deleteCode !== code) return;

    try {
      await api.delete(`/users/delete_meeting/${code}`);
      setRecentMeetings((prevMeetings) =>
        prevMeetings.filter((meeting) => meeting.meetingCode !== code),
      );
      toast.success("Meeting deteled successfully");
      setDeleteCode(null);
    } catch (e) {
      toast.error("Failed to delete meeting");
      setDeleteCode(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header */}

      <Navbar />

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* New meeting and join card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* New meeting button */}
            <button
              onClick={handleNewMeeting}
              className="flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex-1 group"
            >
              <PlusCircle className="h-6 w-6 group-hover:rotate-90 transition-transform" />
              <span className="text-lg">New meeting</span>
            </button>

            {/* Divider for larger screens */}
            <div className="hidden md:flex items-center text-gray-400 font-medium">
              or
            </div>

            {/* Join meeting form */}
            <form onSubmit={handleJoinMeeting} className="flex-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter meeting code"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-400"
                    aria-label="Meeting code"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-6 py-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow border border-gray-300 sm:w-auto w-full"
                >
                  <span>Join</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <History className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Recent meetings
            </h2>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
              {error}
            </div>
          )}

          {!loading && !error && recentMeetings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No recent meetings found.</p>
              <p className="text-sm mt-2">
                Start a new meeting to see it here.
              </p>
            </div>
          )}

          {!loading && !error && recentMeetings.length > 0 && (
            <ul className="space-y-3">
              {recentMeetings.map((meeting) => (
                <li
                  key={meeting._id}
                  className={`group flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all duration-300
${
  deleteCode === meeting.meetingCode
    ? "opacity-0 translate-x-full"
    : "opacity-100 translate-x-0"
}
`}
                  onTransitionEnd={() =>
                    handleTransitionEnd(meeting.meetingCode)
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
                    <span className="font-mono text-blue-600 font-bold text-lg tracking-wider">
                      {meeting.meetingCode}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(meeting.date)}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-4">
                    {" "}
                    <button
                      onClick={() => joinFromHistory(meeting.meetingCode)}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white border border-gray-300 hover:bg-blue-600 hover:text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <span>Join</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMeeting(meeting.meetingCode)}
                      disabled={deleteCode === meeting.meetingCode}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white  border border-gray-300 hover:bg-black hover:text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <span>Delete</span>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
