import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationItem } from '../models/insurance';
import { NotificationsRepo } from '../repositories/firestoreRepo';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refresh = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const all = await NotificationsRepo.getAll();
    const userNotifs = all.filter(n => n.userId === user.id || n.userId === user.role || n.userId === 'all');
    setNotifications(userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const markAsRead = async (id: string) => {
    await NotificationsRepo.update(id, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
