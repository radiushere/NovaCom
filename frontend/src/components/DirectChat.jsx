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
            if (data && data.id) setFriendData(data);
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

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] relative bg-museum-bg">

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b border-museum-stone bg-white/80 backdrop-blur z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-museum-muted hover:text-museum-text text-xl">←</button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-museum-stone overflow-hidden border border-museum-stone">
                            {friendData && friendData.avatar && friendData.avatar !== "NULL" ? (
                                <img src={friendData.avatar} className="w-full h-full object-cover" alt="p" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-museum-muted font-serif">{friendName[0]}</div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-museum-text">{friendName}</h2>
                            <p className="text-xs text-museum-muted uppercase tracking-widest">Private Channel</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-museum-stone">
                {loading && <div className="text-center text-xs text-museum-muted animate-pulse pb-2">Retrieving Archives...</div>}

                {messages.map((m, idx) => {
                    const isMe = m.senderId === parseInt(currentUserId);
                    return (
                        <div key={`${m.id}-${idx}`} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`flex max-w-[85%] gap-4 group items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                                {/* BUBBLE WRAPPER */}
                                <div className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}>

                                    {/* REPLY PREVIEW */}
                                    {m.replyTo > -1 && (
                                        <div className={`text-xs p-2 mb-1 rounded border-l-2 opacity-80 ${isMe ? "bg-museum-stone/20 border-museum-text text-museum-muted" : "bg-white border-museum-stone text-museum-muted"}`}>
                                            <span className="opacity-60 text-[10px] uppercase block mb-0.5">Replying to:</span>
                                            <span className="italic line-clamp-1 max-w-[200px]">"{m.replyPreview || "Message unavailable"}"</span>
                                        </div>
                                    )}

                                    {/* CONTENT */}
                                    {m.type === "image" ? (
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
                                ${isMe ? "bg-museum-text text-white rounded-tl-xl rounded-bl-xl rounded-br-xl" : "bg-white border border-museum-stone text-museum-text rounded-tr-xl rounded-br-xl rounded-bl-xl"}`}>
                                            {m.content}
                                        </div>
                                    )}

                                    {/* METADATA */}
                                    <div className="absolute -bottom-5 w-full flex justify-between px-1 min-w-[60px]">
                                        <span className="text-[9px] text-museum-muted uppercase tracking-widest">{m.time}</span>
                                        {isMe && m.seen && <span className="text-[9px] text-museum-muted italic">Seen</span>}
                                    </div>
                                </div>

                                {/* HOVER TOOLS */}
                                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-white shadow-sm rounded p-1 border border-museum-stone ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                    <button onClick={() => setReplyTarget({ id: m.id, content: m.type === 'image' ? '[Image]' : m.type === 'audio' ? '[Audio]' : m.content })} className="p-1.5 text-museum-muted hover:text-museum-text hover:bg-museum-stone/20 rounded" title="Reply">
                                        ↩
                                    </button>
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

            {/* INPUT */}
            <div className="p-6 bg-white border-t border-museum-stone shrink-0">
                <form onSubmit={handleSendText} className="flex gap-3 items-center">

                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                    {/* Tools Group */}
                    <div className="flex gap-1">
                        <button type="button" onClick={() => fileInputRef.current.click()} className="text-museum-muted hover:text-museum-text p-2 rounded-full hover:bg-museum-stone/20 transition" title="Image">
                            📷
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
                        placeholder={replyTarget ? "Type your reply..." : isRecording ? "Recording..." : `Message ${friendName}...`}
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        disabled={isRecording}
                    />
                    <button type="submit" className="bg-museum-text text-white font-medium px-6 py-3 rounded-none hover:bg-black shadow-sm transition uppercase tracking-widest text-xs">SEND</button>
                </form>
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

export default DirectChat;