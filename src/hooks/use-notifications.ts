import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  writeBatch,
  updateDoc,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './use-auth';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderImage: string;
  type: 'message';
  message: string;
  threadId: string;
  read: boolean;
  seen: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));
        
        setNotifications(notificationsData);
        setLoading(false);
      }, (error) => {
        console.error('Error in notifications subscription:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { 
        read: true,
        seen: true 
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const batch = writeBatch(db);
      const unreadQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        where('read', '==', false)
      );

      const unreadDocs = await getDocs(unreadQuery);
      
      unreadDocs.forEach((doc) => {
        batch.update(doc.ref, { 
          read: true,
          seen: true 
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  const markAsSeen = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { seen: true });
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  }, [user]);

  const markAllAsSeen = useCallback(async () => {
    if (!user) return;

    try {
      const batch = writeBatch(db);
      const unseenQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid),
        where('seen', '==', false)
      );

      const unseenDocs = await getDocs(unseenQuery);
      
      unseenDocs.forEach((doc) => {
        batch.update(doc.ref, { seen: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all as seen:', error);
    }
  }, [user]);

  return {
    notifications,
    loading,
    markAllAsRead,
    markAsRead,
    markAsSeen,
    markAllAsSeen,
    unreadCount: notifications.filter(n => !n.read).length,
    unseenCount: notifications.filter(n => !n.seen).length
  };
}