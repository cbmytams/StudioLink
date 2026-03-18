import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  NotificationItem,
  MOCK_PRO_NOTIFICATIONS,
  MOCK_STUDIO_NOTIFICATIONS
} from '@/data/mockNotifications';

type UserType = 'studio' | 'pro';

const cloneNotifications = (items: NotificationItem[]) => items.map((item) => ({ ...item }));
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
      notifications: cloneNotifications(MOCK_PRO_NOTIFICATIONS),
      studioNotifications: cloneNotifications(MOCK_STUDIO_NOTIFICATIONS),
      proNotifications: cloneNotifications(MOCK_PRO_NOTIFICATIONS),
      activeUserType: 'pro',
      unreadCount: countUnread(MOCK_PRO_NOTIFICATIONS),

      markRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((item) =>
            item.id === id ? { ...item, isRead: true } : item
          );

          if (state.activeUserType === 'studio') {
            return {
              notifications: updated,
              studioNotifications: updated,
              unreadCount: countUnread(updated)
            };
          }

          return {
            notifications: updated,
            proNotifications: updated,
            unreadCount: countUnread(updated)
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
              unreadCount: 0
            };
          }

          return {
            notifications: updated,
            proNotifications: updated,
            unreadCount: 0
          };
        }),

      resetByUserType: (userType) =>
        set((state) => {
          const studioNotifications =
            state.studioNotifications.length > 0
              ? state.studioNotifications
              : cloneNotifications(MOCK_STUDIO_NOTIFICATIONS);
          const proNotifications =
            state.proNotifications.length > 0
              ? state.proNotifications
              : cloneNotifications(MOCK_PRO_NOTIFICATIONS);

          const active = userType === 'studio' ? studioNotifications : proNotifications;

          return {
            activeUserType: userType,
            studioNotifications,
            proNotifications,
            notifications: active,
            unreadCount: countUnread(active)
          };
        }),

      navigateFromNotification: (id) => get().notifications.find((item) => item.id === id)?.route ?? null
    }),
    {
      name: 'studiolink-notifications'
    }
  )
);
