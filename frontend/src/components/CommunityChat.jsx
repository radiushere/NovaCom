import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { callBackend } from '../api';
import PollMessage from './PollMessage';
import CreatePollModal from './CreatePollModal';

const CommunityChat = ({ commId, currentUserId, onLeave, onAbout }) => {
    const [details, setDetails] = useState(null);
    const [messages, setMessages] = useState([]);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [msgInput, setMsgInput] = useState("");

    // UI STATES
    const [showPollModal, setShowPollModal] = useState(false);
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

    // Refs
    const scrollContainerRef = useRef(null);
    const prevScrollHeight = useRef(0);
    const isAtBottom = useRef(true);
    const loadingHistory = useRef(false);
    const fileInputRef = useRef(null);

    // 1. Fetch Latest
    const fetchLatest = async () => {
        if (loadingHistory.current) return;

        const data = await callBackend('get_community', [commId, currentUserId, 0, MSG_LIMIT]);
        if (data && data.id) {
            setDetails(data);
            setTotalMsgs(data.total_msgs);
            setPinnedMessages(data.messages.filter(m => m.pinned));
            if (offset === 0) setMessages(data.messages);
        }
    };

    useEffect(() => {
        setOffset(0); isAtBottom.current = true; fetchLatest();
        const interval = setInterval(() => { if (offset === 0) fetchLatest(); }, 2000);
        return () => clearInterval(interval);
    }, [commId]);

    useLayoutEffect(() => {
        if (!scrollContainerRef.current) return;
        const { scrollHeight } = scrollContainerRef.current;
        if (isAtBottom.current) scrollContainerRef.current.scrollTop = scrollHeight;
        else if (prevScrollHeight.current > 0) {
            scrollContainerRef.current.scrollTop = scrollHeight - prevScrollHeight.current;
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
            const data = await callBackend('get_community', [commId, currentUserId, newOffset, MSG_LIMIT]);
            if (data && data.messages.length > 0) { setMessages(prev => [...data.messages, ...prev]); setOffset(newOffset); }
            setLoading(false); loadingHistory.current = false;
        }
    };

    // --- ACTIONS ---

    const sendMessage = async (content, type = "text", mediaUrl = "NONE") => {
        const replyId = replyTarget ? replyTarget.index : -1;
        await callBackend('send_message', [commId, currentUserId, replyId, type, mediaUrl, content]);
        setMsgInput(""); setReplyTarget(null); setOffset(0); isAtBottom.current = true; fetchLatest();
    };

    const handleSendText = async (e) => {
        e.preventDefault();
        if (!msgInput.trim()) return;
        await sendMessage(msgInput, "text", "NONE");
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                sendMessage("Sent an image", "image", base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64 = reader.result;
                    sendMessage("Voice Message", "audio", base64);
                };
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) { console.error("Mic Error", err); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleVote = async (msgId) => { await callBackend('vote_message', [commId, currentUserId, msgId]); fetchLatest(); };
    const handlePin = async (msgId) => { await callBackend('mod_pin', [commId, currentUserId, msgId]); fetchLatest(); };
    const handleDelete = async (msgId) => { await callBackend('mod_delete', [commId, currentUserId, msgId]); fetchLatest(); };
    const handleBan = async (targetId) => { if (confirm("Ban user?")) { await callBackend('mod_ban', [commId, currentUserId, targetId]); fetchLatest(); } };
    const handleLeaveCommunity = async () => { if (confirm("Leave collection?")) { await callBackend('leave_community', [currentUserId, commId]); onLeave(); } };
    const handleUnban = async () => { const t = prompt("User ID to Unban:"); if (t) { await callBackend('mod_unban', [commId, currentUserId, t]); alert("Done."); } };

    if (!details) return <div className="text-museum-muted text-center mt-10 animate-pulse font-serif">Loading Collection...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] relative bg-museum-bg">

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b border-museum-stone bg-white/80 backdrop-blur z-20 shrink-0">
                <div>
                    <h2 className="text-2xl font-serif text-museum-text flex items-center gap-2">
                        {details.name}
                        {details.is_mod && <span className="text-[10px] bg-museum-text text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Curator</span>}
                    </h2>
                    <p className="text-xs text-museum-muted mt-1">{details.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onAbout} className="text-museum-muted hover:text-museum-text text-xs uppercase tracking-widest border-b border-transparent hover:border-museum-text transition-all">About</button>
                    {details.is_mod && <button onClick={handleUnban} className="text-museum-muted hover:text-museum-text text-xs uppercase tracking-widest border-b border-transparent hover:border-museum-text transition-all">Bans</button>}
                    {details.is_member && <button onClick={handleLeaveCommunity} className="text-red-400 hover:text-red-600 text-xs uppercase tracking-widest border-b border-transparent hover:border-red-400 transition-all">Leave</button>}
                    <button onClick={onLeave} className="text-museum-muted hover:text-museum-text text-lg px-2">✕</button>
                </div>
            </div>

            {/* PINNED MESSAGES */}
            {pinnedMessages.length > 0 && (
                <div className="bg-museum-surface border-b border-museum-stone p-3 z-10 shadow-sm shrink-0">
                    <div className="flex items-center gap-2 text-museum-gold text-xs font-bold uppercase mb-2 tracking-widest"><span>📌 Pinned</span></div>
                    <div className="flex flex-col gap-2 max-h-24 overflow-y-auto scrollbar-thin">
                        {pinnedMessages.map((m, i) => (
                            <div key={i} className="text-sm text-museum-text flex justify-between items-center bg-museum-bg p-2 rounded border border-museum-stone">
                                <span className="truncate w-11/12"><span className="font-bold text-museum-text mr-2">{m.sender}:</span> {m.content}</span>
                                {details.is_mod && <button onClick={() => handlePin(m.index)} className="text-[10px] text-red-400 hover:text-red-600 ml-2">Unpin</button>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CHAT SCROLL AREA */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-museum-stone">
                {loading && <div className="text-center text-xs text-museum-muted animate-pulse pb-2">Retrieving Archives...</div>}

                {messages.map((m, idx) => {
                    const isMe = m.senderId === parseInt(currentUserId);
                    return (
                        <div key={`${m.id}-${idx}`} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>

                            {/* Message Row */}
                            <div className={`flex max-w-[85%] gap-4 group items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                                {/* AVATAR */}
                                <div className="w-8 h-8 rounded-full bg-museum-stone overflow-hidden flex-shrink-0">
                                    {m.senderAvatar && m.senderAvatar !== "NULL" ? (
                                        <img src={m.senderAvatar} className="w-full h-full object-cover" alt="p" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-museum-muted font-serif">{m.sender[0]}</div>
                                    )}
                                </div>

                                {/* BUBBLE WRAPPER */}
                                <div className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>

                                    {!isMe && <div className="text-[10px] text-museum-muted ml-1 mb-1 uppercase tracking-wider">{m.sender}</div>}

                                    {/* REPLY PREVIEW */}
                                    {m.replyTo > -1 && (
                                        <div className={`text-xs p-2 mb-1 rounded border-l-2 opacity-80 ${isMe ? "bg-museum-stone/20 border-museum-text text-museum-muted" : "bg-white border-museum-stone text-museum-muted"}`}>
                                            <span className="opacity-60 text-[10px] uppercase block mb-0.5">Replying to:</span>
                                            <span className="italic line-clamp-1 max-w-[200px]">"{m.replyPreview || "Message unavailable"}"</span>
                                        </div>
                                    )}

                                    {/* MAIN CONTENT */}
                                    {m.type === "poll" ? (
                                        <div className={`px-4 py-4 text-sm shadow-sm rounded-none border ${isMe ? "bg-white border-museum-text" : "bg-white border-museum-stone"}`}>
                                            <PollMessage poll={m.poll} msgId={m.id} commId={commId} currentUserId={currentUserId} onUpdate={fetchLatest} />
                                        </div>
                                    ) : m.type === "image" ? (
                                        <div className={`p-1 shadow-sm rounded-none border overflow-hidden cursor-pointer ${isMe ? "bg-white border-museum-text" : "bg-white border-museum-stone"}`}>
                                            <img
                                                src={m.mediaUrl}
                                                alt="shared"
                                                className="max-w-[300px] max-h-[400px] object-cover hover:opacity-95 transition"
                                                onClick={() => setExpandedImage(m.mediaUrl)}
                                            />
                                        </div>
                                    ) : m.type === "audio" ? (
                                        <div className={`p-3 shadow-sm rounded-none min-w-[260px] flex items-center justify-center border ${isMe ? "bg-white border-museum-text" : "bg-white border-museum-stone"}`}>
                                            <audio
                                                controls
                                                src={m.mediaUrl}
                                                className="w-full h-8 focus:outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`px-5 py-3 text-sm shadow-sm 
                                ${m.pinned ? "border-l-4 border-l-museum-gold" : ""} 
                                ${isMe ? "bg-museum-text text-white rounded-tl-xl rounded-bl-xl rounded-br-xl" : "bg-white border border-museum-stone text-museum-text rounded-tr-xl rounded-br-xl rounded-bl-xl"}`}>
                                            {m.content}
                                        </div>
                                    )}

                                    {/* METADATA */}
                                    <div className="absolute -bottom-5 w-full flex justify-between px-1 min-w-[60px]">
                                        <span className="text-[9px] text-museum-muted uppercase tracking-widest">{m.time}</span>
                                        {m.votes > 0 && <span className="text-[9px] font-bold text-museum-text">▲ {m.votes}</span>}
                                    </div>
                                </div>

                                {/* HOVER TOOLS */}
                                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-white shadow-sm rounded p-1 border border-museum-stone ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                    <button onClick={() => setReplyTarget({ index: m.id, content: m.type === 'image' ? '[Image]' : m.type === 'audio' ? '[Audio]' : m.content })} className="p-1.5 text-museum-muted hover:text-museum-text hover:bg-museum-stone/20 rounded" title="Reply">
                                        ↩
                                    </button>
                                    <button onClick={() => handleVote(m.index)} className={`p-1.5 rounded text-xs ${m.has_voted ? "text-museum-gold font-bold" : "text-museum-muted hover:text-museum-text hover:bg-museum-stone/20"}`}>▲</button>
                                    {(details.is_mod || isMe) && (
                                        <>
                                            {details.is_mod && <button onClick={() => handlePin(m.index)} className={`p-1.5 text-xs rounded hover:bg-museum-stone/20 ${m.pinned ? "text-museum-gold" : "text-museum-muted hover:text-museum-gold"}`}>📌</button>}
                                            <button onClick={() => handleDelete(m.index)} className="p-1.5 text-xs text-museum-muted hover:text-red-500 hover:bg-museum-stone/20 rounded">🗑️</button>
                                            {details.is_mod && !isMe && <button onClick={() => handleBan(m.senderId)} className="px-1.5 py-0.5 text-[9px] text-red-500 font-bold border border-red-500/30 rounded hover:bg-red-500/10 ml-1">BAN</button>}
                                        </>
                                    )}
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>

            {/* REPLY CONTEXT BAR */}
            {replyTarget && (
                <div className="bg-white border-t border-museum-stone p-3 px-6 flex justify-between items-center animate-slide-up shrink-0">
                    <div className="text-xs text-museum-muted pl-3 border-l-2 border-museum-text">
                        <span className="text-museum-text font-bold mr-2">Replying to:</span>
                        <span className="italic opacity-80 line-clamp-1">{replyTarget.content}</span>
                    </div>
                    <button onClick={() => setReplyTarget(null)} className="text-museum-muted hover:text-museum-text hover:bg-museum-stone/20 rounded-full p-1 transition">✕</button>
                </div>
            )}

            {/* POLL MODAL */}
            {showPollModal && <CreatePollModal commId={commId} currentUserId={currentUserId} onClose={() => setShowPollModal(false)} onRefresh={fetchLatest} />}

            {/* INPUT */}
            <div className="p-6 bg-white border-t border-museum-stone shrink-0">
                {details.is_member ? (
                    <form onSubmit={handleSendText} className="flex gap-3 items-center">

                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                        {/* Tools Group */}
                        <div className="flex gap-1">
                            <button type="button" onClick={() => fileInputRef.current.click()} className="text-museum-muted hover:text-museum-text p-2 rounded-full hover:bg-museum-stone/20 transition" title="Image">
                                📷
                            </button>
                            <button type="button" onClick={() => setShowPollModal(true)} className="text-museum-muted hover:text-museum-text p-2 rounded-full hover:bg-museum-stone/20 transition" title="Poll">
                                📊
                            </button>
                            <button
                                type="button"
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onMouseLeave={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                className={`p-2 rounded-full transition duration-200 ${isRecording ? "bg-red-500 text-white animate-pulse" : "text-museum-muted hover:text-museum-text hover:bg-museum-stone/20"}`}
                                title="Hold to Record"
                            >
                                🎤
                            </button>
                        </div>

                        <input
                            className="flex-1 bg-museum-bg px-4 py-3 rounded-none border-b border-museum-stone text-museum-text focus:border-museum-text outline-none placeholder-museum-muted transition-colors"
                            placeholder={replyTarget ? "Type your reply..." : isRecording ? "Recording..." : `Message ${details.name}...`}
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                            disabled={isRecording}
                        />
                        <button type="submit" className="bg-museum-text text-white font-medium px-6 py-3 rounded-none hover:bg-black shadow-sm transition uppercase tracking-widest text-xs">SEND</button>
                    </form>
                ) : (
                    <div className="text-center"><button onClick={() => callBackend('join_community', [currentUserId, commId]).then(fetchLatest)} className="bg-museum-text text-white font-bold px-8 py-3 rounded-none shadow-lg hover:bg-black transition uppercase tracking-widest text-xs">JOIN COLLECTION</button></div>
                )}
            </div>

            {/* IMAGE VIEWER */}
            {expandedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md p-8 animate-fade-in" onClick={() => setExpandedImage(null)}>
                    <button onClick={() => setExpandedImage(null)} className="absolute top-6 right-6 text-museum-text hover:text-red-500 bg-museum-stone/20 hover:bg-museum-stone/40 p-2 rounded-full transition">✕</button>
                    <img src={expandedImage} className="max-w-full max-h-[90vh] shadow-2xl object-contain cursor-default border border-museum-stone" onClick={(e) => e.stopPropagation()} alt="Enlarged" />
                </div>
            )}

        </div>
    );
};

export default CommunityChat;