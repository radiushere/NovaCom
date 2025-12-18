import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { callBackend } from '../api';

const DirectChat = ({ currentUserId, friendId, friendName, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [replyTarget, setReplyTarget] = useState(null); 
  const [expandedImage, setExpandedImage] = useState(null);

  // RECORDING STATE
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Pagination State
  const [offset, setOffset] = useState(0);
  const [totalMsgs, setTotalMsgs] = useState(0);
  const [loading, setLoading] = useState(false);
  const MSG_LIMIT = 50;

  const scrollRef = useRef(null); 
  const prevScrollHeight = useRef(0);
  const isAtBottom = useRef(true);
  const loadingHistory = useRef(false);
  const fileInputRef = useRef(null);

  // 1. Fetch Latest Data
  const fetchLatest = async () => {
    if (loadingHistory.current) return;
    const data = await callBackend('get_dm', [currentUserId, friendId, 0, MSG_LIMIT]);
    if (data && data.messages) {
        setTotalMsgs(data.total_msgs || data.messages.length);
        if (offset === 0) setMessages(data.messages);
    }
  };

  useEffect(() => {
    setOffset(0); isAtBottom.current = true; fetchLatest();
    const interval = setInterval(() => { if (offset === 0) fetchLatest(); }, 2000);
    return () => clearInterval(interval);
  }, [friendId]);

  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const { scrollHeight } = scrollRef.current;
    if (isAtBottom.current) scrollRef.current.scrollTop = scrollHeight;
    else if (prevScrollHeight.current > 0) {
        scrollRef.current.scrollTop = scrollHeight - prevScrollHeight.current;
        prevScrollHeight.current = 0;
    }
  }, [messages]);

  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    isAtBottom.current = atBottom;

    if (scrollTop === 0 && messages.length < totalMsgs && !loading && !loadingHistory.current) {
        setLoading(true); loadingHistory.current = true; prevScrollHeight.current = scrollHeight;
        const newOffset = offset + MSG_LIMIT;
        const data = await callBackend('get_dm', [currentUserId, friendId, newOffset, MSG_LIMIT]);
        if (data && data.messages.length > 0) { setMessages(prev => [...data.messages, ...prev]); setOffset(newOffset); }
        setLoading(false); loadingHistory.current = false;
    }
  };

  // --- ACTIONS ---

  const sendMessage = async (content, type = "text", mediaUrl = "NONE") => {
    const replyId = replyTarget ? replyTarget.id : -1;
    await callBackend('send_dm', [currentUserId, friendId, replyId, type, mediaUrl, content]);
    setMsgInput(""); setReplyTarget(null); setOffset(0); isAtBottom.current = true; fetchLatest();
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    await sendMessage(msgInput, "text", "NONE");
  };

  const handleReaction = async (msgId) => {
    const reaction = prompt("Enter Emoji:");
    if (reaction) { await callBackend('react_dm', [currentUserId, friendId, msgId, reaction]); fetchLatest(); }
  };

  const handleDelete = async (msgId) => {
      if(window.confirm("Unsend this message?")) { await callBackend('delete_dm', [currentUserId, friendId, msgId]); fetchLatest(); }
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => sendMessage("Sent an image", "image", reader.result);
          reader.readAsDataURL(file);
      }
  };

  // --- VOICE NOTE LOGIC ---

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob); 
            reader.onloadend = () => {
                sendMessage("Voice Message 🎤", "audio", reader.result);
            };
            stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic access denied:", err);
        alert("Cannot access microphone. Check permissions.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative bg-void-black/50">
      
      {/* HEADER */}
      <div className="p-4 border-b border-white/10 bg-void-black/80 backdrop-blur z-20 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold border border-white/20">
                {friendName[0].toUpperCase()}
            </div>
            <div>
                <h2 className="text-lg font-orbitron text-white tracking-wide">@{friendName}</h2>
                <p className="text-[10px] text-green-400 uppercase tracking-widest">Encrypted Signal</p>
            </div>
        </div>
        <button onClick={onBack} className="text-gray-400 hover:text-white px-3 py-1 hover:bg-white/10 rounded transition">✕ Close</button>
      </div>

      {/* MESSAGES AREA */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        {loading && <div className="text-center text-xs text-cyan-supernova animate-pulse pb-2">Retrieving Archives...</div>}

        {messages.map((m) => {
            const isMe = m.senderId === parseInt(currentUserId);
            return (
                <div key={m.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[80%] items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        
                        <div className="relative flex flex-col">
                            {/* Reply Preview */}
                            {m.replyTo !== -1 && (
                                <div className={`text-xs p-2 rounded-t-lg mb-0.5 border-l-2 ${isMe ? "bg-purple-900/50 border-purple-400 text-purple-200" : "bg-gray-800 border-gray-500 text-gray-400"}`}>
                                    <span className="opacity-70 text-[10px] uppercase block mb-1">Replying to:</span>
                                    <span className="italic line-clamp-1">"{m.replyPreview || "Unavailable"}"</span>
                                </div>
                            )}

                            {/* MAIN BUBBLE CONTENT */}
                            <div 
                                className={`shadow-lg backdrop-blur-sm cursor-pointer overflow-hidden
                                    ${m.replyTo !== -1 ? "rounded-b-xl rounded-tr-xl" : "rounded-2xl"}
                                    ${isMe 
                                        ? "bg-gradient-to-br from-cosmic-purple to-purple-700 text-white rounded-tr-none" 
                                        : "bg-deep-void border border-white/10 text-gray-100 rounded-tl-none"
                                    }
                                `}
                                onDoubleClick={() => handleReaction(m.id)}
                            >
                                {m.type === 'image' ? (
                                    <div className="p-1">
                                        <img src={m.mediaUrl} alt="sent" className="max-w-[250px] max-h-[300px] rounded-lg object-cover hover:opacity-90 transition" onClick={() => setExpandedImage(m.mediaUrl)} />
                                    </div>
                                ) : m.type === 'audio' ? (
                                    // IMPROVED AUDIO PLAYER DESIGN
                                    <div className="p-2 min-w-[260px] flex items-center justify-center">
                                        <audio 
                                            controls 
                                            src={m.mediaUrl} 
                                            className="w-full h-10 rounded-md focus:outline-none" 
                                            style={{ filter: isMe ? "invert(1) hue-rotate(180deg)" : "invert(0.9)" }} // Stylistic filter to blend better
                                        />
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 text-sm">{m.content}</div>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="absolute -bottom-5 w-full flex justify-between px-1">
                                {m.reaction ? <div className="bg-black/80 rounded-full px-1.5 py-0.5 text-xs border border-white/20 shadow -mt-2 z-10">{m.reaction}</div> : <span></span>}
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    {m.time}
                                    {isMe && <span>{m.isSeen ? <span className="text-cyan-supernova font-bold">✓✓</span> : "✓"}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Hover Tools */}
                        <div className={`flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "items-end" : "items-start"}`}>
                            <button onClick={() => setReplyTarget({ id: m.id, content: m.type==='image'?'[Image]':m.type==='audio'?'[Audio]':m.content })} className="p-1.5 text-gray-500 hover:text-cyan-supernova hover:bg-white/10 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                            </button>
                            {isMe && (
                                <button onClick={() => handleDelete(m.id)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-white/10 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* REPLY CONTEXT */}
      {replyTarget && (
          <div className="bg-black/80 border-t border-cyan-supernova/30 p-2 px-4 flex justify-between items-center animate-slide-up backdrop-blur shrink-0">
              <div className="text-xs text-gray-300 pl-2 border-l-2 border-cyan-supernova"><span className="text-cyan-supernova font-bold mr-2">Replying to:</span> <span className="italic opacity-80 line-clamp-1">{replyTarget.content}</span></div>
              <button onClick={() => setReplyTarget(null)} className="text-gray-500 hover:text-white hover:bg-white/10 rounded-full p-1 transition">✕</button>
          </div>
      )}

      {/* INPUT BAR */}
      <form onSubmit={handleSendText} className="p-4 border-t border-white/10 bg-void-black/90 flex gap-3 shrink-0 items-center select-none">
        
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        
        <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-cyan-supernova p-2 rounded-full hover:bg-white/5 transition" title="Image">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </button>

        {/* PUSH TO TALK BUTTON */}
        <button 
            type="button" 
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-2 rounded-full transition duration-200 ${isRecording ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_red]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            title="Hold to Record"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>

        <input 
            className="flex-1 bg-deep-void px-4 py-3 rounded-xl border border-white/10 text-white focus:border-cyan-supernova focus:ring-1 focus:ring-cyan-supernova outline-none placeholder-gray-600 transition"
            placeholder={replyTarget ? "Type your reply..." : isRecording ? "Recording Audio..." : "Send a secure message..."}
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            disabled={isRecording}
        />
        <button type="submit" className="bg-cyan-supernova text-black font-bold px-6 py-3 rounded-xl hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition">SEND</button>
      </form>

      {/* IMAGE MODAL */}
      {expandedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in" onClick={() => setExpandedImage(null)}>
              <button onClick={() => setExpandedImage(null)} className="absolute top-6 right-6 text-white hover:text-red-500 bg-white/10 hover:bg-white/20 p-2 rounded-full transition">✕</button>
              <img src={expandedImage} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain cursor-default" onClick={(e) => e.stopPropagation()} alt="Enlarged"/>
          </div>
      )}

    </div>
  );
};

export default DirectChat;