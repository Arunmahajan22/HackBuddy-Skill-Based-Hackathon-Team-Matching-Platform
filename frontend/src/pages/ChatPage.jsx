import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Circle,
  LoaderCircle,
  MessageCircle,
  Send,
  Users,
  User,
  WifiOff,
} from 'lucide-react';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const formatTime = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))
    : '';

const formatLastSeen = (value) =>
  value
    ? `Last seen ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))}`
    : 'Offline';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, connectionState, toast } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedUserId = searchParams.get('user');
  const requestedConversationId = searchParams.get('conversation');
  const requestedTeamId = searchParams.get('team');

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'teams' | 'direct'
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  const typingTimer = useRef(null);
  const bottomRef = useRef(null);
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;

  const active = useMemo(
    () => conversations.find((item) => item._id === activeId),
    [conversations, activeId],
  );

  // Load all user conversations (team group chats and 1-on-1 direct chats)
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      const convList = data.conversations || [];
      setConversations(convList);

      // Resolve initial active conversation based on query parameters
      if (requestedTeamId) {
        const foundTeam = convList.find((c) => c.type === 'team' && (c.team?._id === requestedTeamId || c.team === requestedTeamId));
        if (foundTeam) {
          setActiveId(foundTeam._id);
          setActiveTab('teams');
        }
      } else if (requestedConversationId) {
        setActiveId(requestedConversationId);
      } else if (!activeIdRef.current && convList.length > 0) {
        setActiveId(convList[0]._id);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [requestedConversationId, requestedTeamId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle ?user=<userId> query param to start or open a direct chat
  useEffect(() => {
    if (!requestedUserId) return;
    api
      .post('/chat/conversations', { userId: requestedUserId })
      .then(({ data }) => {
        setConversations((old) =>
          old.some((item) => item._id === data.conversation._id)
            ? old
            : [data.conversation, ...old],
        );
        setActiveId(data.conversation._id);
        setActiveTab('direct');
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || 'Unable to open direct chat with this user.'),
      );
  }, [requestedUserId]);

  // Handle ?team=<teamId> query param to open or create a team chat
  useEffect(() => {
    if (!requestedTeamId) return;
    api
      .get(`/chat/teams/${requestedTeamId}`)
      .then(({ data }) => {
        if (data.conversation) {
          setConversations((old) =>
            old.some((item) => item._id === data.conversation._id)
              ? old
              : [data.conversation, ...old],
          );
          setActiveId(data.conversation._id);
          setActiveTab('teams');
        }
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || 'Unable to access this team chat. Membership required.'),
      );
  }, [requestedTeamId]);

  // Load message history for active conversation
  const loadMessages = useCallback(
    async (conv) => {
      if (!conv) {
        setMessages([]);
        return;
      }
      setMessagesLoading(true);
      setError('');

      try {
        let loadedMessages = [];
        if (conv.type === 'team') {
          const teamId = conv.team?._id || conv.team;
          const { data } = await api.get(`/chat/teams/${teamId}/messages`);
          loadedMessages = data.messages || [];

          // Join team room via Socket.IO
          if (socket?.connected) {
            socket.emit('team:join', teamId);
          }
        } else {
          const { data } = await api.get(`/chat/conversations/${conv._id}/messages`);
          loadedMessages = data.messages || [];

          if (socket?.connected) {
            socket.emit('conversation:join', conv._id);
          }
        }

        setMessages(loadedMessages);

        // Mark messages as read
        api.post(`/chat/conversations/${conv._id}/read`).catch(() => {});
        setConversations((old) =>
          old.map((item) => (item._id === conv._id ? { ...item, unreadCount: 0 } : item)),
        );
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load message history.');
      } finally {
        setMessagesLoading(false);
      }
    },
    [socket],
  );

  useEffect(() => {
    loadMessages(active);

    return () => {
      if (active && socket?.connected) {
        if (active.type === 'team') {
          const teamId = active.team?._id || active.team;
          socket.emit('team:leave', teamId);
        } else {
          socket.emit('conversation:leave', active._id);
        }
      }
    };
  }, [active, loadMessages, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Socket event listeners for incoming messages, typing status, and presence
  useEffect(() => {
    if (!socket) return undefined;

    const onMessage = (payload) => {
      const { conversationId, teamId, message } = payload;
      const targetId = conversationId;

      setConversations((old) => {
        const found = old.find((item) => item._id === targetId || (teamId && (item.team?._id === teamId || item.team === teamId)));
        if (!found) {
          loadConversations();
          return old;
        }

        const isActive = activeIdRef.current === found._id;
        const senderId = message.sender?._id || message.sender;
        const isFromMe = senderId === user?._id;

        const next = {
          ...found,
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          lastMessageSender: message.sender,
          unreadCount: !isActive && !isFromMe ? (found.unreadCount || 0) + 1 : isActive ? 0 : found.unreadCount,
        };

        return [next, ...old.filter((item) => item._id !== found._id)];
      });

      // If viewing the conversation that received the message, append it to messages
      const isCurrentActive =
        activeIdRef.current === targetId ||
        (active?.type === 'team' && teamId && (active.team?._id === teamId || active.team === teamId));

      if (isCurrentActive) {
        setMessages((old) => (old.some((m) => m._id === message._id) ? old : [...old, message]));
        socket.emit('messages:read', { conversationId: targetId });
      } else {
        const senderId = message.sender?._id || message.sender;
        if (senderId !== user?._id) {
          const senderName = message.sender?.name || 'A teammate';
          toast('info', `New message from ${senderName}`);
        }
      }
    };

    const onTyping = ({ conversationId, userId: typingUserId, isTyping }) => {
      if (conversationId === activeIdRef.current && typingUserId !== user?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [typingUserId]: isTyping,
        }));
      }
    };

    const onTeamTyping = ({ teamId, userId: typingUserId, isTyping }) => {
      const currentTeamId = active?.team?._id || active?.team;
      if (currentTeamId === teamId && typingUserId !== user?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [typingUserId]: isTyping,
        }));
      }
    };

    const onPresence = ({ userId: onlineUserId, isOnline, lastSeen }) => {
      setConversations((old) =>
        old.map((item) => {
          if (item.type === 'direct' && (item.otherUser?._id === onlineUserId || item.otherUser === onlineUserId)) {
            return {
              ...item,
              isOnline,
              otherUser: {
                ...item.otherUser,
                lastSeen: lastSeen || item.otherUser?.lastSeen,
              },
            };
          }
          return item;
        }),
      );
    };

    socket.on('message:new', onMessage);
    socket.on('typing:update', onTyping);
    socket.on('team:typing:update', onTeamTyping);
    socket.on('presence:update', onPresence);

    return () => {
      socket.off('message:new', onMessage);
      socket.off('typing:update', onTyping);
      socket.off('team:typing:update', onTeamTyping);
      socket.off('presence:update', onPresence);
    };
  }, [socket, user?._id, active, loadConversations, toast]);

  // Handle typing debounce
  const emitTyping = (nextDraft) => {
    setDraft(nextDraft);
    if (!socket?.connected || !active) return;

    if (active.type === 'team') {
      const teamId = active.team?._id || active.team;
      socket.emit('team:typing:start', { teamId });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('team:typing:stop', { teamId });
      }, 1200);
    } else {
      socket.emit('typing:start', { conversationId: active._id });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: active._id });
      }, 1200);
    }
  };

  // Send message
  const handleSend = (event) => {
    event.preventDefault();
    if (!draft.trim() || !active || sending) return;

    const content = draft.trim();
    setDraft('');
    setSending(true);
    clearTimeout(typingTimer.current);

    if (active.type === 'team') {
      const teamId = active.team?._id || active.team;
      socket.emit('team:typing:stop', { teamId });

      if (socket?.connected) {
        socket.emit('team:message:send', { teamId, content }, (result) => {
          setSending(false);
          if (!result?.ok) {
            setDraft(content);
            setError(result?.message || 'Message could not be delivered to team chat.');
          }
        });
      } else {
        // Fallback to HTTP endpoint if WebSocket is reconnecting
        api
          .post(`/chat/teams/${teamId}/messages`, { content })
          .then(({ data }) => {
            setSending(false);
            setMessages((old) => [...old, data.message]);
          })
          .catch((reqErr) => {
            setSending(false);
            setDraft(content);
            setError(reqErr.response?.data?.message || 'Failed to send message.');
          });
      }
    } else {
      socket.emit('typing:stop', { conversationId: active._id });

      if (socket?.connected) {
        socket.emit('message:send', { conversationId: active._id, content }, (result) => {
          setSending(false);
          if (!result?.ok) {
            setDraft(content);
            setError(result?.message || 'Direct message failed to send.');
          }
        });
      } else {
        api
          .post(`/chat/conversations/${active._id}/messages`, { content })
          .then(({ data }) => {
            setSending(false);
            setMessages((old) => [...old, data.message]);
          })
          .catch((reqErr) => {
            setSending(false);
            setDraft(content);
            setError(reqErr.response?.data?.message || 'Failed to send message.');
          });
      }
    }
  };

  // Filter conversations based on sidebar tab
  const filteredConversations = useMemo(() => {
    if (activeTab === 'teams') return conversations.filter((c) => c.type === 'team');
    if (activeTab === 'direct') return conversations.filter((c) => c.type !== 'team');
    return conversations;
  }, [conversations, activeTab]);

  const teamConversationsCount = conversations.filter((c) => c.type === 'team').length;
  const directConversationsCount = conversations.filter((c) => c.type !== 'team').length;

  const anyTyping = Object.values(typingUsers).some(Boolean);

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Top Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <Link
              to="/app"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600"
            >
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <h1 className="mt-1 font-display text-2xl font-extrabold">Team & Builder Messages</h1>
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              connectionState === 'connected' ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {connectionState === 'connected' ? <Circle size={10} fill="currentColor" /> : <WifiOff size={14} />}
            {connectionState === 'connected' ? 'Live WebSocket' : 'Reconnecting…'}
          </div>
        </div>

        {/* Chat Container */}
        <div className="grid h-[calc(100vh-11rem)] min-h-[34rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[21rem_1fr] dark:border-white/10 dark:bg-ink-900">
          {/* Left Sidebar */}
          <aside className={`${activeId ? 'hidden md:flex' : 'flex'} flex-col border-r border-slate-200 dark:border-white/10`}>
            {/* Tab Filter */}
            <div className="border-b border-slate-200 p-3 dark:border-white/10">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`rounded-lg py-1.5 transition ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  All ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('teams')}
                  className={`flex items-center justify-center gap-1 rounded-lg py-1.5 transition ${
                    activeTab === 'teams'
                      ? 'bg-white text-brand-600 shadow-sm dark:bg-ink-900 dark:text-brand-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Users size={12} />
                  Teams ({teamConversationsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('direct')}
                  className={`flex items-center justify-center gap-1 rounded-lg py-1.5 transition ${
                    activeTab === 'direct'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <User size={12} />
                  Direct ({directConversationsCount})
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  <LoaderCircle className="mr-2 inline animate-spin" size={15} />
                  Loading your chats…
                </div>
              ) : filteredConversations.length ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredConversations.map((item) => {
                    const isTeam = item.type === 'team';
                    const title = isTeam
                      ? item.team?.hackathonName || 'Team Group Chat'
                      : item.otherUser?.name || 'Teammate';
                    const subtitle = isTeam
                      ? `${item.team?.members?.length || 0} members · Team Room`
                      : item.otherUser?.branch || 'Teammate';

                    return (
                      <button
                        key={item._id}
                        onClick={() => {
                          setActiveId(item._id);
                          setSearchParams({
                            conversation: item._id,
                            ...(isTeam ? { team: item.team?._id || item.team } : {}),
                          });
                        }}
                        className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5 ${
                          activeId === item._id ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <span
                          className={`relative grid size-10 shrink-0 place-items-center rounded-xl font-bold ${
                            isTeam
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                          }`}
                        >
                          {isTeam ? <Users size={18} /> : item.otherUser?.name?.[0]?.toUpperCase() || 'U'}
                          {!isTeam && item.isOnline && (
                            <i className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-1">
                            <b className="truncate text-sm font-semibold">{title}</b>
                            <time className="shrink-0 text-[10px] text-slate-400">
                              {formatTime(item.lastMessageAt)}
                            </time>
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">{subtitle}</span>
                          <span className="mt-1 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {item.lastMessage || 'No messages yet'}
                            </span>
                            {item.unreadCount > 0 && (
                              <i className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold not-italic text-white">
                                {item.unreadCount}
                              </i>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  <MessageCircle className="mx-auto mb-2 text-slate-400" size={28} />
                  <p className="font-semibold">No chats found</p>
                  <p className="mt-1 text-xs">
                    {activeTab === 'teams'
                      ? 'Join or create a team to chat with teammates.'
                      : 'Accept incoming join requests or start a direct message with an accepted teammate.'}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Right Main Chat Viewport */}
          <div className={`${activeId ? 'flex' : 'hidden md:flex'} min-w-0 flex-col bg-white dark:bg-ink-900`}>
            {active ? (
              <>
                {/* Active Chat Header */}
                <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      className="md:hidden text-slate-500 hover:text-slate-900"
                      onClick={() => setActiveId(null)}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-xl font-bold ${
                        active.type === 'team'
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                          : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                      }`}
                    >
                      {active.type === 'team' ? <Users size={16} /> : active.otherUser?.name?.[0]?.toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <b className="block truncate text-sm font-bold">
                        {active.type === 'team'
                          ? active.team?.hackathonName || 'Team Chat Room'
                          : active.otherUser?.name}
                      </b>
                      <small className="block truncate text-xs text-slate-500">
                        {active.type === 'team'
                          ? `${active.team?.members?.length || 0} team members authorized`
                          : active.isOnline
                          ? 'Online now'
                          : formatLastSeen(active.otherUser?.lastSeen)}
                      </small>
                    </div>
                  </div>

                  {active.type === 'team' && (
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      Team Group Chat
                    </span>
                  )}
                </header>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 dark:bg-black/15">
                  {messagesLoading ? (
                    <div className="py-12 text-center text-sm text-slate-500">
                      <LoaderCircle className="mr-2 inline animate-spin" size={16} />
                      Loading message history…
                    </div>
                  ) : messages.length ? (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const senderId = message.sender?._id || message.sender;
                        const isFromMe = senderId === user?._id;
                        const senderName = isFromMe ? 'You' : message.sender?.name || 'Teammate';

                        return (
                          <div
                            key={message._id}
                            className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                isFromMe
                                  ? 'rounded-br-sm bg-brand-600 text-white'
                                  : 'rounded-bl-sm border border-slate-200/80 bg-white text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100'
                              }`}
                            >
                              {active.type === 'team' && !isFromMe && (
                                <p className="mb-1 text-[11px] font-bold text-brand-600 dark:text-brand-300">
                                  {senderName}
                                  {message.sender?.branch && (
                                    <span className="ml-1 font-normal text-slate-400">
                                      · {message.sender.branch}
                                    </span>
                                  )}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                              <time
                                className={`mt-1 block text-right text-[10px] ${
                                  isFromMe ? 'text-brand-100' : 'text-slate-400'
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </time>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-slate-500">
                      <MessageCircle className="mx-auto mb-2 text-slate-400" size={28} />
                      <p className="font-semibold">No messages yet.</p>
                      <p className="mt-1 text-xs">
                        {active.type === 'team'
                          ? 'Say hello to your hackathon teammates and start planning your project!'
                          : 'Send a message to coordinate with your teammate.'}
                      </p>
                    </div>
                  )}

                  {anyTyping && (
                    <p className="mt-2 text-xs italic text-slate-500 animate-pulse">
                      A teammate is typing…
                    </p>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSend} className="border-t border-slate-200 p-3 dark:border-white/10">
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(event) => emitTyping(event.target.value)}
                      maxLength={2000}
                      disabled={sending}
                      placeholder={
                        connectionState === 'connected'
                          ? active.type === 'team'
                            ? `Message #${active.team?.hackathonName || 'team'}…`
                            : `Message ${active.otherUser?.name || 'teammate'}…`
                          : 'Connecting to real-time chat…'
                      }
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500 disabled:opacity-40"
                      aria-label="Send message"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center text-slate-500">
                <div>
                  <MessageCircle className="mx-auto mb-3 text-brand-500" size={36} />
                  <p className="font-bold text-base text-slate-800 dark:text-slate-100">
                    Select a conversation
                  </p>
                  <p className="mt-1 text-sm">
                    Choose a team chat or direct conversation from the sidebar to start collaborating.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>
    </Layout>
  );
}
