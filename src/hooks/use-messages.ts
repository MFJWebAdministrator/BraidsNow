import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from './use-auth';
import type { Message, MessageThread } from '@/lib/schemas/message';

export function useMessages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteClients, setFavoriteClients] = useState<string[]>([]);

  // Fetch favorite clients for stylists
  useEffect(() => {
    if (!user) return;

    const fetchFavoriteClients = async () => {
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, where('stylistId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const clientIds = snapshot.docs.map(doc => doc.data().userId);
        setFavoriteClients(clientIds);
      });

      return () => unsubscribe();
    };

    fetchFavoriteClients();
  }, [user]);

  // Subscribe to message threads
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const threadsQuery = query(
        collection(db, 'messageThreads'),
        where('participants', 'array-contains', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        threadsQuery, 
        (snapshot) => {
          const threadsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as MessageThread));
          
          setThreads(threadsData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Error loading threads:', error);
          setError('Failed to load message threads');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up threads subscription:', error);
      setError('Failed to load message threads');
      setLoading(false);
    }
  }, [user]);

  // Subscribe to messages for selected thread
  useEffect(() => {
    if (!user || !selectedThreadId) {
      setMessages([]);
      return;
    }

    try {
      // First verify thread access
      const threadRef = doc(db, 'messageThreads', selectedThreadId);
      getDoc(threadRef).then(threadDoc => {
        if (!threadDoc.exists()) {
          setError('Thread not found');
          return;
        }

        const threadData = threadDoc.data();
        if (!threadData.participants.includes(user.uid)) {
          setError('Access denied');
          return;
        }

        // If access verified, subscribe to messages
        const messagesQuery = query(
          collection(db, 'messages'),
          where('threadId', '==', selectedThreadId),
          orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Message));
            
            // Mark messages as read
            const unreadMessages = messagesData.filter(
              msg => !msg.readBy.includes(user.uid)
            );

            if (unreadMessages.length > 0) {
              unreadMessages.forEach(msg => {
                const messageRef = doc(db, 'messages', msg.id);
                updateDoc(messageRef, {
                  readBy: arrayUnion(user.uid)
                });
              });
            }
            
            setMessages(messagesData);
            setError(null);
          },
          (error) => {
            console.error('Error loading messages:', error);
            setError('Failed to load messages');
          }
        );

        return () => unsubscribe();
      });
    } catch (error) {
      console.error('Error setting up messages subscription:', error);
      setError('Failed to load messages');
    }
  }, [selectedThreadId, user]);

  // Function to send mass message to favorite clients
  const sendMassMessage = async (content: string) => {
    if (!user || favoriteClients.length === 0) return;

    try {
      const batch = writeBatch(db);

      for (const clientId of favoriteClients) {
        // Create or get thread ID
        const threadId = [user.uid, clientId].sort().join('_');
        const threadRef = doc(db, 'messageThreads', threadId);
        const messageRef = doc(collection(db, 'messages'));

        // Create message
        const message = {
          id: messageRef.id,
          threadId,
          content,
          senderId: user.uid,
          senderName: user.displayName || 'Stylist',
          senderImage: user.photoURL,
          participants: [user.uid, clientId],
          readBy: [user.uid],
          createdAt: new Date().toISOString()
        };

        // Update thread
        batch.set(threadRef, {
          id: threadId,
          participants: [user.uid, clientId],
          lastMessage: {
            content,
            senderId: user.uid,
            createdAt: new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Add message
        batch.set(messageRef, message);
      }

      await batch.commit();
    } catch (error) {
      console.error('Error sending mass message:', error);
      throw error;
    }
  };

  return {
    threads,
    messages,
    loading,
    error,
    selectedThreadId,
    setSelectedThreadId,
    sendMassMessage,
    favoriteClients
  };
}