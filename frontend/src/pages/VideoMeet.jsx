import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import OutlinedInput from "../components/OutlinedInput";
import { io } from "socket.io-client";
import {
  User,
  X,
  VideoIcon,
  VideoOffIcon,
  MicIcon,
  MicOffIcon,
} from "lucide-react";
import {
  MdOutlineCallEnd,
  MdOutlineScreenShare,
  MdOutlineStopScreenShare,
} from "react-icons/md";
import { BsChatText } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoMeetComponent() {
  const { meetingCode } = useParams();
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);

  const localVideoRef = useRef(null);
  const connectionsRef = useRef({});

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);

  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);

  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const [remoteStreams, setRemoteStreams] = useState([]);
  const [remoteNames, setRemoteNames] = useState({});
  const participantCount = remoteStreams.length + 1;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [showChat, setShowChat] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const navigate = useNavigate();

  /* Attach local video */
  const setLocalVideoRef = useCallback((node) => {
    if (node) {
      localVideoRef.current = node;
      if (window.localStream) {
        node.srcObject = window.localStream;
      }
    }
  }, []);

  /* Initial media permissions */
  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        window.localStream = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        setVideoAvailable(true);
        setAudioAvailable(true);
        setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
      } catch {
        setVideoAvailable(false);
        setAudioAvailable(false);
      }
    };

    init();

    return () => {
      window.localStream?.getTracks().forEach((t) => t.stop());
      Object.values(connectionsRef.current).forEach((pc) => pc.close());
      socketRef.current?.disconnect();
    };
  }, []);

  /* Toggle Video */
  const toggleVideo = () => {
    if (!videoAvailable) return;
    const newState = !video;
    setVideo(newState);
    window.localStream
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = newState));
    if (socketRef.current) {
      socketRef.current.emit("media-state", { video: newState, audio });
    }
  };

  /* Toggle Audio */
  const toggleAudio = () => {
    if (!audioAvailable) return;
    const newState = !audio;
    setAudio(newState);
    window.localStream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = newState));
    if (socketRef.current) {
      socketRef.current.emit("media-state", { video, audio: newState });
    }
  };

  /* Toggle Chat – resets unread count when opened */
  const toggleChat = () => {
    setShowChat((prev) => {
      const newState = !prev;
      if (newState) {
        setNewMessages(0);
      }
      return newState;
    });
  };

  /* Create Peer */
  const createPeerConnection = (remoteId) => {
    const pc = new RTCPeerConnection(peerConfigConnections);

    window.localStream
      ?.getTracks()
      .forEach((track) => pc.addTrack(track, window.localStream));

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => {
        const exists = prev.find((p) => p.socketId === remoteId);
        if (exists) {
          return prev.map((p) =>
            p.socketId === remoteId ? { ...p, stream: event.streams[0] } : p,
          );
        }
        return prev.some((p) => p.socketId === remoteId)
          ? prev
          : [...prev, { socketId: remoteId, stream: event.streams[0] }];
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit(
          "signal",
          remoteId,
          JSON.stringify({ ice: event.candidate }),
        );
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        setRemoteStreams((prev) => prev.filter((r) => r.socketId !== remoteId));
        setRemoteNames((prev) => {
          const newNames = { ...prev };
          delete newNames[remoteId];
          return newNames;
        });
        delete connectionsRef.current[remoteId];
      }
    };

    connectionsRef.current[remoteId] = pc;
    return pc;
  };

  /* Handle Signals */
  const gotMessageFromServer = useCallback(
    (fromId, message) => {
      if (fromId === socketIdRef.current) return;

      const signal = JSON.parse(message);

      /* Chat */
      if (signal.type === "chat") {
        setMessages((prev) => [...prev, signal.message]);
        if (!showChat) setNewMessages((prev) => prev + 1);
        return;
      }

      /* User info (name) */
      if (signal.type === "user-info") {
        setRemoteNames((prev) => ({ ...prev, [fromId]: signal.username }));
        return;
      }

      let pc = connectionsRef.current[fromId];

      if (signal.sdp) {
        if (!pc) pc = createPeerConnection(fromId);

        const sdpType = signal.sdp.type;

        // Ignore offers/answers that don't match the expected signaling state
        // to prevent glare. The warnings have been removed to avoid console noise.
        if (sdpType === "offer" && pc.signalingState !== "stable") {
          return;
        }
        if (sdpType === "answer" && pc.signalingState !== "have-local-offer") {
          return;
        }

        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (sdpType === "offer") return pc.createAnswer();
          })
          .then((answer) => answer && pc.setLocalDescription(answer))
          .then(() => {
            if (pc.localDescription) {
              socketRef.current?.emit(
                "signal",
                fromId,
                JSON.stringify({ sdp: pc.localDescription }),
              );
            }
          })
          .catch(console.error);
      }

      if (signal.ice && pc) {
        pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(
          console.error,
        );
      }
    },
    [showChat],
  );

  /* Connect Socket */
  const connectToSocketServer = useCallback(() => {
    // VERY IMPORTANT FIX
    // cleanup old peers before reconnect

    Object.values(connectionsRef.current).forEach((pc) => pc.close());

    connectionsRef.current = {};

    setRemoteStreams([]);

    setRemoteNames({});

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnecting(true);

    const socket = io(SERVER_URL, {
      forceNew: true,
      reconnection: false,
    });

    socketRef.current = socket;

    socket.on("signal", gotMessageFromServer);

    socket.on("connect", () => {
      socketIdRef.current = socket.id;

      setIsConnecting(false);

      socket.emit("join-call", meetingCode);
    });

    socket.on("user-joined", (newUserId) => {
      if (newUserId === socket.id) return;

      if (connectionsRef.current[newUserId]) return;

      const pc = createPeerConnection(newUserId);

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit(
            "signal",
            newUserId,
            JSON.stringify({ sdp: pc.localDescription }),
          );
        });
    });

    socket.on("user-left", (userId) => {
      if (connectionsRef.current[userId]) {
        connectionsRef.current[userId].close();

        delete connectionsRef.current[userId];
      }

      setRemoteStreams((prev) => prev.filter((r) => r.socketId !== userId));
    });
  }, [meetingCode, gotMessageFromServer]);

  const connect = () => {
    if (username.trim()) {
      setAskForUsername(false);
      connectToSocketServer();
    }
  };

  /* Send Chat */
  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = { sender: username, text: message, timestamp: Date.now() };
    setMessages((prev) => [...prev, msg]);
    setMessage("");
    Object.keys(connectionsRef.current).forEach((id) => {
      socketRef.current.emit(
        "signal",
        id,
        JSON.stringify({ type: "chat", message: msg }),
      );
    });
  };

  /* Screen Share */
  const toggleScreenShare = async () => {
    if (!screenAvailable) return;

    try {
      if (!screen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        Object.values(connectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          setScreen(false);
          const videoTrack = window.localStream?.getVideoTracks()[0];
          if (videoTrack) {
            Object.values(connectionsRef.current).forEach((pc) => {
              const sender = pc
                .getSenders()
                .find((s) => s.track?.kind === "video");
              if (sender) sender.replaceTrack(videoTrack);
            });
          }
        };

        setScreen(true);
      } else {
        const videoTrack = window.localStream?.getVideoTracks()[0];
        if (videoTrack) {
          Object.values(connectionsRef.current).forEach((pc) => {
            const sender = pc
              .getSenders()
              .find((s) => s.track?.kind === "video");
            if (sender) sender.replaceTrack(videoTrack);
          });
        }
        setScreen(false);
      }
    } catch (error) {
      console.error("Screen share error:", error);
      setScreen(false);
    }
  };

  /* End Call */
  const endCall = () => {
    Object.values(connectionsRef.current).forEach((pc) => pc.close());
    connectionsRef.current = {};
    setRemoteStreams([]);
    setRemoteNames({});

    if (socketRef.current) {
      socketRef.current.emit("leave-call", meetingCode);
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => track.stop());
    }

    navigate("/home");
  };

  const getGridClass = () => {
    const count = remoteStreams.length + 1;

    if (count === 1) return "grid-cols-1";
    return `
    sm:grid-cols-2
    md:grid-cols-${Math.ceil(Math.sqrt(count))}
    lg:grid-cols-${Math.ceil(Math.sqrt(count))}
  `;
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[rgb(1,4,48)]">
      {askForUsername ? (
        /* Join UI */
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-[#010430] via-[#020757] to-[#030a85] p-2">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-3xl font-bold text-white text-center mb-2">
              Join Meeting
            </h2>
            <p className="text-white/60 text-center mb-6">Connect instantly</p>
            <OutlinedInput
              label="Full Name"
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-white"
            />
            {connectionError && (
              <p className="text-red-500 text-sm mt-2">{connectionError}</p>
            )}
            <button
              onClick={connect}
              disabled={!username.trim() || isConnecting}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl"
            >
              {isConnecting ? "Connecting..." : "Join Call"}
            </button>
            <video
              ref={setLocalVideoRef}
              autoPlay
              muted
              className="mt-6 rounded-xl"
            />
          </div>
        </div>
      ) : (
        <div className="flex h-screen bg-[rgb(1,4,48)] overflow-hidden p-4">
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
              <div
                className={`grid ${getGridClass()} auto-rows-fr gap-4 w-full h-full`}
              >
                {/* Self view  */}
                <div className="relative">
                  <video
                    ref={setLocalVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-xl bg-black aspect-video"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {username} (you)
                  </div>
                </div>

                {/* remote view  */}
                {remoteStreams.map((remote) => (
                  <div key={remote.socketId} className="relative group">
                    <video
                      ref={(ref) => {
                        if (
                          ref &&
                          remote.stream &&
                          ref.srcObject !== remote.stream
                        ) {
                          ref.srcObject = remote.stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover rounded-xl bg-black aspect-video"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs transition">
                      {remoteNames[remote.socketId] || "Participant"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Participants */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-black/50 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm backdrop-blur-md border border-white/20 z-20">
              <span className="font-semibold">{participantCount}</span>{" "}
              participant{participantCount !== 1 ? "s" : ""}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-black/70 px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-md shadow-lg z-30">
              <button
                onClick={toggleVideo}
                disabled={!videoAvailable}
                className="p-1 sm:p-0"
              >
                {video ? (
                  <VideoIcon
                    size={22}
                    className="text-white hover:scale-110 transition"
                  />
                ) : (
                  <VideoOffIcon
                    size={22}
                    className="text-red-400 hover:scale-110 transition"
                  />
                )}
              </button>

              <button
                onClick={toggleAudio}
                disabled={!audioAvailable}
                className="p-1 sm:p-0"
              >
                {audio ? (
                  <MicIcon
                    size={22}
                    className="text-white hover:scale-110 transition"
                  />
                ) : (
                  <MicOffIcon
                    size={22}
                    className="text-red-400 hover:scale-110 transition"
                  />
                )}
              </button>

              <button onClick={toggleChat} className="relative p-1 sm:p-0">
                <BsChatText
                  size={22}
                  className="text-white hover:scale-110 transition"
                />
                {newMessages > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold min-w-5 h-5 flex items-center justify-center rounded-full px-1">
                    {newMessages}
                  </span>
                )}
              </button>

              <button
                onClick={toggleScreenShare}
                disabled={!screenAvailable}
                className="p-1 sm:p-0"
              >
                {screen ? (
                  <MdOutlineStopScreenShare
                    size={22}
                    className="text-red-400 hover:scale-110 transition"
                  />
                ) : (
                  <MdOutlineScreenShare
                    size={22}
                    className="text-white hover:scale-110 transition"
                  />
                )}
              </button>

              <button
                onClick={endCall}
                className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition hover:scale-110"
              >
                <MdOutlineCallEnd size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Chat */}
<AnimatePresence>
  {showChat && (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="
        fixed sm:relative
        top-0 right-0
        w-full sm:w-80
        h-[100dvh] sm:h-full
        bg-black/95 sm:bg-black/90
        backdrop-blur-md
        border-l border-white/20
        flex flex-col
        z-50 sm:z-40
      "
    >
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex justify-between items-center">
        <h3 className="text-white font-semibold text-base">
          Chat
        </h3>
        <button
          onClick={toggleChat}
          className="text-white/60 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded text-sm ${
              msg.sender === username
                ? "bg-blue-600/30 ml-auto"
                : "bg-white/10"
            } max-w-[85%] break-words`}
          >
            <p className="text-xs text-white/60 mb-0.5">
              {msg.sender === username ? "You" : msg.sender}
            </p>
            <p className="text-white">{msg.text}</p>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-white/40 text-center text-sm">
            No messages yet
          </p>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-4 py-2 rounded-lg bg-white/10 text-white outline-none"
          />

          <button
            onClick={sendMessage}
            className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Send
          </button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
          
          
        </div>
      )}
    </div>
  );
}
