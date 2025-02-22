import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function NotificationIcon() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Query for messages where the user is a participant and hasn't read the message
    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      where('readBy', 'array-contains', user.uid, '!=', true)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      // Count messages that haven't been read by the user
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.readBy.includes(user.uid);
      }).length;
      
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  const handleClick = async () => {
    if (!user) return;

    try {
      // Check if user is a stylist or client
      const stylistDoc = await getDoc(doc(db, 'stylists', user.uid));
      
      // Route to the appropriate messages page
      if (stylistDoc.exists()) {
        navigate('/dashboard/stylist/messages');
      } else {
        navigate('/dashboard/client/messages');
      }
    } catch (error) {
      console.error('Error navigating to messages:', error);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative"
      onClick={handleClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-xs text-white font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </Button>
  );
}