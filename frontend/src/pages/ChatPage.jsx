import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Circle, LoaderCircle, MessageCircle, Send, WifiOff } from 'lucide-react';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const formatTime = (value) => value ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '';
const formatLastSeen = (value) => value ? `Last seen ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))}` : 'Offline';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, connectionState, toast } = useSocket();
  const [searchParams] = useSearchParams();
  const requestedUserId = searchParams.get('user');
  const requestedConversationId = searchParams.get('conversation');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef(null);
  const bottomRef = useRef(null);
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;
  const active = conversations.find((item) => item._id === activeId);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations || []);
      setActiveId((current) => requestedConversationId || current || data.conversations?.[0]?._id || null);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load conversations.'); }
    finally { setLoading(false); }
  }, [requestedConversationId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (!requestedUserId) return;
    api.post('/chat/conversations', { userId: requestedUserId })
      .then(({ data }) => { setConversations((old) => old.some((item) => item._id === data.conversation._id) ? old : [data.conversation, ...old]); setActiveId(data.conversation._id); })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to open this chat.'));
  }, [requestedUserId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) { setMessages([]); return; }
    setMessagesLoading(true); setError('');
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(data.messages || []);
      if (socket?.connected) socket.emit('conversation:join', conversationId);
      api.post(`/chat/conversations/${conversationId}/read`).catch(() => {});
      setConversations((old) => old.map((item) => item._id === conversationId ? { ...item, unreadCount: 0 } : item));
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load messages.'); }
    finally { setMessagesLoading(false); }
  }, [socket]);
  useEffect(() => { loadMessages(activeId); return () => { if (activeId && socket?.connected) socket.emit('conversation:leave', activeId); }; }, [activeId, loadMessages, socket]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = ({ conversationId, message }) => {
      setConversations((old) => {
        const found = old.find((item) => item._id === conversationId);
        if (!found) { loadConversations(); return old; }
        const isActive = activeIdRef.current === conversationId;
        const next = { ...found, lastMessage: message.content, lastMessageAt: message.createdAt, lastMessageSender: message.sender, unreadCount: message.receiver === user._id && !isActive ? found.unreadCount + 1 : isActive ? 0 : found.unreadCount };
        return [next, ...old.filter((item) => item._id !== conversationId)];
      });
      if (conversationId === activeIdRef.current) {
        setMessages((old) => old.some((item) => item._id === message._id) ? old : [...old, message]);
        if (message.receiver === user._id) socket.emit('messages:read', { conversationId });
      } else if (message.receiver === user._id) toast('info', `New message from ${conversations.find((item) => item._id === conversationId)?.otherUser?.name || 'a teammate'}`);
    };
    const onTyping = ({ conversationId, userId, isTyping }) => { if (conversationId === activeIdRef.current && userId !== user._id) setTyping(isTyping); };
    const onPresence = ({ userId, isOnline, lastSeen }) => setConversations((old) => old.map((item) => item.otherUser?._id === userId ? { ...item, isOnline, otherUser: { ...item.otherUser, lastSeen: lastSeen || item.otherUser.lastSeen } } : item));
    socket.on('message:new', onMessage); socket.on('typing:update', onTyping); socket.on('presence:update', onPresence);
    return () => { socket.off('message:new', onMessage); socket.off('typing:update', onTyping); socket.off('presence:update', onPresence); };
  }, [socket, user._id, loadConversations, toast, conversations]);

  const emitTyping = (nextDraft) => {
    if (!socket?.connected || !activeId) return;
    socket.emit('typing:start', { conversationId: activeId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing:stop', { conversationId: activeId }), 1200);
    setDraft(nextDraft);
  };
  const send = (event) => {
    event.preventDefault();
    if (!draft.trim() || !activeId || sending) return;
    const content = draft; setDraft(''); setSending(true); clearTimeout(typingTimer.current);
    if (!socket?.connected) { setDraft(content); setSending(false); setError('Reconnecting — your message was not sent.'); return; }
    socket.emit('typing:stop', { conversationId: activeId });
    socket.emit('message:send', { conversationId: activeId, content }, (result) => {
      setSending(false);
      if (!result?.ok) { setDraft(content); setError(result?.message || 'Message failed to send.'); }
    });
  };

  return <Layout><section className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><div className="mb-5 flex items-center justify-between"><div><Link to="/app" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600"><ArrowLeft size={14} /> Dashboard</Link><h1 className="mt-1 font-display text-2xl font-extrabold">Messages</h1></div><div className={`flex items-center gap-1.5 text-xs font-semibold ${connectionState === 'connected' ? 'text-emerald-600' : 'text-amber-600'}`}>{connectionState === 'connected' ? <Circle size={10} fill="currentColor" /> : <WifiOff size={14} />}{connectionState === 'connected' ? 'Live' : 'Reconnecting…'}</div></div>
    <div className="grid h-[calc(100vh-11rem)] min-h-[32rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[19rem_1fr] dark:border-white/10 dark:bg-ink-900">
      <aside className={`${activeId ? 'hidden md:block' : 'block'} border-r border-slate-200 dark:border-white/10`}><div className="border-b border-slate-200 p-4 dark:border-white/10"><p className="text-sm font-bold">Your team chats</p><p className="mt-1 text-xs text-slate-500">Only accepted teammates can message you.</p></div>{loading ? <div className="p-4 text-sm text-slate-500"><LoaderCircle className="mr-2 inline animate-spin" size={15} />Loading chats…</div> : conversations.length ? <div className="divide-y divide-slate-100 dark:divide-white/5">{conversations.map((item) => <button key={item._id} onClick={() => setActiveId(item._id)} className={`flex w-full gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 ${activeId === item._id ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''}`}><span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-brand-500/15 font-bold text-brand-600">{item.otherUser?.name?.[0] || 'T'}{item.isOnline && <i className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900" />}</span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><b className="truncate text-sm">{item.otherUser?.name}</b><time className="text-[10px] text-slate-400">{formatTime(item.lastMessageAt)}</time></span><span className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-xs text-slate-500">{item.lastMessage || 'Start the conversation'}</span>{item.unreadCount > 0 && <i className="grid size-5 place-items-center rounded-full bg-brand-600 text-[10px] not-italic text-white">{item.unreadCount}</i>}</span></span></button>)}</div> : <div className="p-6 text-center text-sm text-slate-500"><MessageCircle className="mx-auto mb-2" size={25} />No chats yet. Open one from an accepted teammate.</div>}</aside>
      <div className={`${activeId ? 'flex' : 'hidden md:flex'} min-w-0 flex-col`}>{active ? <><header className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-white/10"><button className="md:hidden" onClick={() => setActiveId(null)} aria-label="Back to conversations"><ArrowLeft size={18} /></button><span className="grid size-9 place-items-center rounded-full bg-brand-500/15 font-bold text-brand-600">{active.otherUser?.name?.[0]}</span><span><b className="block text-sm">{active.otherUser?.name}</b><small className={active.isOnline ? 'text-emerald-600' : 'text-slate-500'}>{active.isOnline ? 'Online' : formatLastSeen(active.otherUser?.lastSeen)}</small></span></header><div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 dark:bg-black/10">{messagesLoading ? <p className="text-center text-sm text-slate-500">Loading messages…</p> : messages.map((message) => <div key={message._id} className={`mb-3 flex ${message.sender === user._id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${message.sender === user._id ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-slate-100'}`}><p className="whitespace-pre-wrap break-words">{message.content}</p><time className={`mt-1 block text-right text-[10px] ${message.sender === user._id ? 'text-brand-100' : 'text-slate-400'}`}>{formatTime(message.createdAt)}</time></div></div>)}{typing && <p className="text-xs italic text-slate-500">{active.otherUser?.name} is typing…</p>}<div ref={bottomRef} /></div><form onSubmit={send} className="border-t border-slate-200 p-3 dark:border-white/10"><div className="flex gap-2"><input value={draft} onChange={(event) => emitTyping(event.target.value)} maxLength={2000} disabled={connectionState !== 'connected'} placeholder={connectionState === 'connected' ? 'Write a message…' : 'Waiting for connection…'} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5" /><button disabled={!draft.trim() || sending || connectionState !== 'connected'} className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white disabled:opacity-40" aria-label="Send message"><Send size={17} /></button></div></form></> : <div className="grid flex-1 place-items-center text-center text-slate-500"><div><MessageCircle className="mx-auto mb-3" size={32} /><p className="font-semibold">Choose a conversation</p><p className="mt-1 text-sm">Your accepted teammates will appear here.</p></div></div>}</div>
    </div>{error && <div className="mt-3 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"><AlertCircle size={17} />{error}</div>}</section></Layout>;
}
