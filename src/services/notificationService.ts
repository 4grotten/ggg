import { toast } from "sonner";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  timestamp: number;
  read: boolean;
  type: 'transaction' | 'profile' | 'system';
  url?: string;
}

const STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 50;

// In-app notification store
function getNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
  const newNotif: AppNotification = {
    ...notif,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    read: false,
  };
  const list = getNotifications();
  list.unshift(newNotif);
  saveNotifications(list);
  
  // Dispatch custom event for live updates
  window.dispatchEvent(new CustomEvent('app-notification', { detail: newNotif }));
  
  return newNotif;
}

export function getAllNotifications(): AppNotification[] {
  return getNotifications();
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

export function markAllRead() {
  const list = getNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(list);
  window.dispatchEvent(new CustomEvent('app-notification-read'));
}

export function clearNotifications() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('app-notification-read'));
}

// Browser Push
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.error('SW registration failed:', e);
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isPushEnabled(): boolean {
  return localStorage.getItem('notif_push_enabled') === 'true';
}

// Send both browser push (local) and in-app notification
export function sendNotification(opts: {
  title: string;
  body: string;
  type: 'transaction' | 'profile' | 'system';
  icon?: string;
  url?: string;
}) {
  // 1. In-app notification (always)
  addNotification(opts);
  
  // 2. Show toast
  toast.info(opts.title, { description: opts.body });
  
  // 3. Browser push (if enabled + permission granted)
  if (isPushEnabled() && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(opts.title, {
        body: opts.body,
        icon: opts.icon || '/app-icon-192.png',
        badge: '/app-icon-192.png',
      });
    } catch {
      // Fallback: use service worker
      navigator.serviceWorker?.ready.then(reg => {
        reg.showNotification(opts.title, {
          body: opts.body,
          icon: opts.icon || '/app-icon-192.png',
          badge: '/app-icon-192.png',
        });
      });
    }
  }
}
