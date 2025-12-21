import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { callBackend } from '../api';

const DirectChat = ({ currentUserId, friendId, friendName, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [friendData, setFriendData] = useState(null); 
  const [msgInput, setMsgInput] = useState("");
  const [replyTarget, setReplyTarget] = useState(null); 
  const [expandedImage, setExpandedImage] = useState(null);

  // Voice Note Logic
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Infinite Scroll & Pagination
  const [offset, setOffset] = useState(0);
  const [totalMsgs, setTotalMsgs] = useState(0);
  const [loading, setLoading] = useState(false);
  const MSG_LIMIT = 50;

  // Scroll Management Refs
  const scrollRef = useRef(null); 
  const prevScrollHeight = useRef(0);
  const isAtBottom = useRef(true);
  const loadingHistory = useRef(false);
  const fileInputRef = useRef(null);

  // Fetch DM Archives
  const fetchMessages = async () => {
    if (loadingHistory.current) return;
    const data = await callBackend('get_dm', [currentUserId, friendId, 0, MSG_LIMIT]);
    if (data && data.messages) {
        setTotalMsgs(data.total_msgs || data.messages.length);
        if (offset === 0) {
            setMessages(data.messages);
        }
    }
  };

  useEffect(() => {
    // BUG FIX 1: Fetch profile for the avatar
    callBackend('get_user', [friendId]).then(data => {
        if(data && data.id) setFriendData(data);
    });

    setOffset(0);
    isAtBottom.current = true;
    fetchMessages();
    
    const interval = setInterval(() => {
        if (offset === 0) fetchMessages();
    }, 2000);
    return () => clearInterval(interval);
  }, [friendId]);

  // Smooth Reverse Scroll Logic
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const { scrollHeight } = scrollRef.current;
    if (isAtBottom.current) {
        scrollRef.current.scrollTop = scrollHeight;
    } else if (prevScrollHeight.current > 0) {
        const heightDiff = scrollHeight - prevScrollHeight.current;
        scrollRef.current.scrollTop = heightDiff;
        prevScrollHeight.current = 0;
    }
  }, [messages]);

  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottom.current = atBottom;

    if (scrollTop === 0 && messages.length < totalMsgs && !loading && !loadingHistory.current) {
        setLoading(true);
        loadingHistory.current = true;
        prevScrollHeight.current = scrollHeight;
        const newOffset = offset + MSG_LIMIT;
        const data = await callBackend('get_dm', [currentUserId, friendId, newOffset, MSG_LIMIT]);
        if (data && data.messages.length > 0) {
            setMessages(prev => [...data.messages, ...prev]);
            setOffset(newOffset);
        }
        setLoading(false);
        loadingHistory.current = false;
    }
  };

  // Multimedia Handlers
  const sendMessage = async (content, type = "text", mediaUrl = "NONE") => {
    const replyId = replyTarget ? replyTarget.id : -1;
    await callBackend('send_dm', [currentUserId, friendId, replyId, type, mediaUrl, content]);
    setMsgInput(""); setReplyTarget(null); setOffset(0); isAtBottom.current = true; fetchMessages();
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    await sendMessage(msgInput, "text", "NONE");
  };

  const handleReaction = async (msgId) => {
    const reaction = prompt("Input Emoji Reaction:");
    if (reaction) {
        await callBackend('react_dm', [currentUserId, friendId, msgId, reaction]);
        fetchMessages();
    }
  };

  const handleDelete = async (msgId) => {
      if(window.confirm("Unsend this message?")) {
          await callBackend('delete_dm', [currentUserId, friendId, msgId]);
          fetchMessages();
      }
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => sendMessage("Sent an Image", "image", reader.result);
          reader.readAsDataURL(file);
      }
      e.target.value = ''; // Reset for re-selection
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = () => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob(audioChunksRef.current, { type: 'audio/webm' })); 
            reader.onloadend = () => sendMessage("Voice Message 🎤", "audio", reader.result);
            stream.getTracks().forEach(track => track.stop());
        };
        recorder.start(); setIsRecording(true);
    } catch (err) { alert("Mic Access Required."); }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop(); setIsRecording(false);
      }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative bg-void-black/50 overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="p-4 border-b border-white/10 bg-void-black/80 backdrop-blur z-20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            {/* BUG FIX 1: Avatar rendering */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold border border-white/20 overflow-hidden shadow-lg">
                {friendData?.avatar && friendData.avatar !== "NULL" ? (
                    <img src={friendData.avatar} className="w-full h-full object-cover" alt="p" />
                ) : (
                    <span className="font-orbitron">{friendName[0].toUpperCase()}</span>
                )}
            </div>
            <div>
                <h2 className="text-xl font-orbitron text-white tracking-widest uppercase">@{friendName}</h2>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[9px] text-green-400 uppercase tracking-widest font-bold">Secure Frequency</p>
                </div>
            </div>
        </div>
        <button onClick={onBack} className="text-gray-400 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10 font-bold uppercase text-xs">
            ✕ Terminate
        </button>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-cyan-supernova/20"
      >
        {loading && <div className="text-center text-xs text-cyan-supernova animate-pulse pb-4 uppercase tracking-[0.2em]">Decrypting Archives...</div>}

        {messages.map((m) => {
            const isMe = m.senderId === parseInt(currentUserId);
            return (
                <div key={m.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[85%] items-end gap-3 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        
                        <div className="relative flex flex-col">
                            {/* Nested Reply Visual */}
                            {m.replyTo !== -1 && (
                                <div className={`text-[11px] p-2.5 rounded-t-xl mb-0.5 border-l-2 ${isMe ? "bg-purple-900/40 border-purple-400 text-purple-200" : "bg-gray-800/80 border-gray-500 text-gray-400"} backdrop-blur-sm`}>
                                    <span className="opacity-50 uppercase font-bold block mb-1 text-[9px] tracking-widest">Incoming Context</span>
                                    <span className="italic line-clamp-1 opacity-80">"{m.replyPreview || "Signal unavailable"}"</span>
                                </div>
                            )}

                            {/* BUBBLE CONTENT */}
                            <div 
                                className={`shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:brightness-110
                                    ${m.replyTo !== -1 ? "rounded-b-2xl rounded-tr-2xl" : "rounded-3xl"}
                                    ${isMe 
                                        ? "bg-gradient-to-br from-cosmic-purple to-purple-800 text-white rounded-tr-none border border-purple-400/20" 
                                        : "bg-deep-void border border-white/10 text-gray-100 rounded-tl-none"
                                    }
                                `}
                                onDoubleClick={() => handleReaction(m.id)}
                            >
                                {m.type === 'image' ? (
                                    <div className="p-1.5">
                                        <img 
                                            src={m.mediaUrl} 
                                            className="max-w-[280px] max-h-[350px] rounded-2xl object-cover hover:scale-[1.02] transition-transform duration-300" 
                                            onClick={() => setExpandedImage(m.mediaUrl)} 
                                            alt="media" 
                                        />
                                    </div>
                                ) : m.type === 'audio' ? (
                                    <div className="p-4 min-w-[280px] flex items-center justify-center">
                                        <audio controls src={m.mediaUrl} className="w-full h-9 rounded-full filter invert brightness-150 grayscale" />
                                    </div>
                                ) : (
                                    <div className="px-5 py-3.5 text-sm leading-relaxed tracking-wide font-medium">{m.content}</div>
                                )}
                            </div>

                            {/* MESSAGE METADATA */}
                            <div className="absolute -bottom-6 w-full flex justify-between px-2 items-center">
                                <div className="flex gap-2 items-center">
                                    {m.reaction ? (
                                        <div className="bg-void-black/80 rounded-full px-2 py-0.5 text-[10px] border border-white/10 shadow-lg -mt-3 z-10 animate-slide-up">
                                            {m.reaction}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                                    {m.time}
                                    {isMe && (
                                        <span>{m.isSeen ? <span className="text-cyan-supernova drop-shadow-glow">✓✓ Seen</span> : <span className="opacity-40">✓</span>}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* HOVER ACTIONS (HORIZONTAL BAR) */}
                        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 mb-3 bg-black/40 p-1 rounded-full border border-white/5 backdrop-blur-sm ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <button 
                                onClick={() => setReplyTarget({ id: m.id, content: m.type==='image'?'[Image]':m.type==='audio'?'[Voice]':m.content })} 
                                className="p-1.5 text-gray-400 hover:text-cyan-supernova hover:bg-white/5 rounded-full transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                            </button>
                            {isMe && (
                                <button 
                                    onClick={() => handleDelete(m.id)} 
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/5 rounded-full transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            );
        })}
      </div>

      {/* FOOTER & INPUT UI */}
      <div className="shrink-0 bg-void-black/95 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {/* Active Reply Banner */}
        {replyTarget && (
            <div className="p-2.5 px-5 flex justify-between bg-cyan-supernova/5 text-xs animate-slide-up border-b border-cyan-supernova/10">
                <span className="text-gray-400 flex items-center gap-2">
                    <span className="text-cyan-supernova font-bold uppercase tracking-widest text-[9px]">Replying to</span>
                    <span className="italic opacity-80 truncate max-w-sm">"{replyTarget.content}"</span>
                </span>
                <button onClick={() => setReplyTarget(null)} className="text-gray-500 hover:text-white p-1 rounded-full bg-white/5 transition">✕</button>
            </div>
        )}

        <form onSubmit={handleSendText} className="p-5 flex gap-4 items-center">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()} 
                    className="text-gray-400 hover:text-cyan-supernova transition-all hover:scale-110 active:scale-90 p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>

                <button 
                    type="button" 
                    onMouseDown={startRecording} 
                    onMouseUp={stopRecording} 
                    onTouchStart={startRecording} 
                    onTouchEnd={stopRecording} 
                    className={`transition-all duration-300 p-1 ${isRecording ? "text-red-500 scale-150 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-gray-400 hover:text-cyan-supernova hover:scale-110"}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
            </div>

            <input 
                className="flex-1 bg-deep-void px-5 py-3.5 rounded-2xl text-sm text-white outline-none border border-white/10 focus:border-cyan-supernova/50 transition-all focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] placeholder:text-gray-600 font-medium" 
                placeholder={isRecording ? "SECURE AUDIO RECORDING IN PROGRESS..." : "ENTER TRANSMISSION..."} 
                value={msgInput} 
                onChange={e => setMsgInput(e.target.value)} 
                disabled={isRecording} 
            />
            
            <button 
                type="submit" 
                className="bg-cyan-supernova text-black font-black px-8 py-3.5 rounded-2xl hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all active:scale-95 uppercase tracking-widest text-xs"
            >
                Transmit
            </button>
        </form>
      </div>

      {/* FULLSCREEN IMAGE OVERLAY */}
      {expandedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 p-10 animate-fade-in cursor-zoom-out" onClick={() => setExpandedImage(null)}>
              <div className="absolute top-10 right-10 flex gap-4">
                  <button className="bg-white/10 hover:bg-red-500 text-white p-3 rounded-full transition-all">✕</button>
              </div>
              <img src={expandedImage} className="max-w-full max-h-full rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10" alt="Enlarged Signal"/>
          </div>
      )}
    </div>
  );
};

export default DirectChat;