import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserType = 'studio' | 'pro';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  route: string;
  isRead: boolean;
}

const countUnread = (items: NotificationItem[]) => items.filter((item) => !item.isRead).length;

interface NotificationsState {
  notifications: NotificationItem[];
  studioNotifications: NotificationItem[];
  proNotifications: NotificationItem[];
  activeUserType: UserType;
  unreadCount: number;
  markRead: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  resetByUserType: (userType: UserType) => void;
  navigateFromNotification: (id: string) => string | null;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      studioNotifications: [],
      proNotifications: [],
      activeUserType: 'pro',
      unreadCount: 0,

      markRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((item) =>
            item.id === id ? { ...item, isRead: true } : item,
          );

          if (state.activeUserType === 'studio') {
            return {
              notifications: updated,
              studioNotifications: updated,
              unreadCount: countUnread(updated),
            };
          }

          return {
            notifications: updated,
            proNotifications: updated,
            unreadCount: countUnread(updated),
          };
        }),

      markAsRead: (id) => get().markRead(id),

      markAllAsRead: () =>
        set((state) => {
          const updated = state.notifications.map((item) => ({ ...item, isRead: true }));

          if (state.activeUserType === 'studio') {
            return {
              notifications: updated,
              studioNotifications: updated,
              unreadCount: 0,
            };
          }

          return {
            notifications: updated,
            proNotifications: updated,
            unreadCount: 0,
          };
        }),

      resetByUserType: (userType) =>
        set((state) => {
          const active = userType === 'studio' ? state.studioNotifications : state.proNotifications;

          return {
            activeUserType: userType,
            notifications: active,
            unreadCount: countUnread(active),
          };
        }),

      navigateFromNotification: (id) => get().notifications.find((item) => item.id === id)?.route ?? null,
    }),
    {
      name: 'studiolink-notifications',
    },
  ),
);
