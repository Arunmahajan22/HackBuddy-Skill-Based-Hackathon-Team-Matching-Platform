import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [eventVersion, setEventVersion] = useState(0);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((type, message) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random()}`;
    const newToast = { id, type, message };
    setNotifications((prev) => [...prev.slice(-4), newToast]); // keep at most 5 toasts

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 5000);
  }, [dismissNotification]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return undefined;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const token = localStorage.getItem('hackbuddy_token');

    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Authenticated socket automatically joins user:<userId> on server
    });

    socket.on('connect_error', (_err) => {
      // Reconnection handled automatically by socket.io-client
    });

    socket.on('request:created', (payload) => {
      const teamName = payload.team?.hackathonName || 'your team';
      const senderName = payload.request?.sender?.name || 'A builder';
      toast('info', `${senderName} submitted a join request for ${teamName}.`);
      setEventVersion((v) => v + 1);
    });

    socket.on('request:updated', (payload) => {
      const teamName = payload.team?.hackathonName || 'the team';
      const status = payload.request?.status;
      if (status === 'accepted') {
        toast('success', `Congratulations! Your request for ${teamName} was accepted!`);
      } else if (status === 'rejected') {
        toast('warning', `Your request for ${teamName} was not accepted.`);
      }
      setEventVersion((v) => v + 1);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('request:created');
      socket.off('request:updated');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, toast]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      notifications,
      dismissNotification,
      eventVersion,
      toast,
    }),
    [notifications, eventVersion, dismissNotification, toast],
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
      <ToastViewport notifications={notifications} dismiss={dismissNotification} />
    </SocketContext.Provider>
  );
}

function ToastViewport({ notifications, dismiss }) {
  if (!notifications.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2.5"
    >
      {notifications.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastItem({ item, onDismiss }) {
  const icons = {
    success: <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />,
    error: <XCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" />,
    warning: <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />,
    info: <Info size={18} className="shrink-0 text-brand-600 dark:text-brand-400" />,
  };

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    warning: 'border-amber-500/30',
    info: 'border-brand-500/30',
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white/95 p-4 text-sm font-medium text-slate-800 shadow-glass backdrop-blur-xl animate-slide-in dark:bg-ink-900/95 dark:text-slate-100 ${
        borders[item.type] || 'border-slate-200 dark:border-white/10'
      }`}
    >
      {icons[item.type] || icons.info}
      <div className="flex-1 leading-snug">{item.message}</div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider.');
  }
  return context;
};
