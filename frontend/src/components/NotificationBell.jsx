import { useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';

const when = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { inboxNotifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useSocket();
  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`} aria-expanded={open} className="icon-button relative"><Bell size={17} />{unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 h-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}</button>{open && <div className="absolute right-0 top-11 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-ink-900"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10"><b className="text-sm">Notifications</b><button type="button" onClick={markAllNotificationsRead} disabled={!unreadNotificationCount} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 disabled:opacity-40 dark:text-brand-300"><CheckCheck size={14} />Mark all read</button></div><div className="max-h-[26rem] overflow-y-auto">{inboxNotifications.length ? inboxNotifications.map((item) => <Link key={item._id} to={item.relatedEntity?.link || '/app'} onClick={() => { if (!item.readAt) markNotificationRead(item._id); setOpen(false); }} className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5 ${item.readAt ? '' : 'bg-brand-50/50 dark:bg-brand-500/5'}`}><div className="flex gap-2"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.readAt ? 'bg-transparent' : 'bg-brand-500'}`} /><span className="min-w-0 flex-1"><b className="block text-xs text-slate-800 dark:text-slate-100">{item.title}</b><span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.message}</span><time className="mt-1 block text-[10px] text-slate-400">{when(item.createdAt)}</time></span></div></Link>) : <div className="p-8 text-center text-sm text-slate-500"><Inbox className="mx-auto mb-2" size={24} />You’re all caught up.</div>}</div></div>}</div>;
}
