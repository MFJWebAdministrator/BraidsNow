// src/pages/dashboard/ClientDashboard/Messages/MessagesContent.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function MessagesContent() {
  const { user } = useAuth();
  const { threads, messages, loading, selectedThreadId, setSelectedThreadId } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter(thread => {
    const otherParticipant = thread.participants.find(p => p !== user?.uid);
    if (!otherParticipant) return false;
    
    const participantDetails = thread.participantDetails[otherParticipant];
    return participantDetails.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSendMessage = async () => {
    if (!user || !selectedThreadId || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const messageRef = doc(collection(db, 'messages'));
      const threadRef = doc(db, 'messageThreads', selectedThreadId);
      const notificationRef = doc(collection(db, 'notifications'));

      const currentThread = threads.find(t => t.id === selectedThreadId);
      if (!currentThread) return;

      // Get the recipient (stylist)
      const recipientId = currentThread.participants.find(p => p !== user.uid);
      if (!recipientId) return;

      const message = {
        id: messageRef.id,
        threadId: selectedThreadId,
        content: newMessage.trim(),
        senderId: user.uid,
        senderName: currentThread.participantDetails[user.uid].name,
        senderImage: currentThread.participantDetails[user.uid].image,
        participants: currentThread.participants,
        readBy: [user.uid],
        createdAt: new Date().toISOString()
      };

      // Create notification for stylist
      const notification = {
        id: notificationRef.id,
        recipientId,
        senderId: user.uid,
        senderName: currentThread.participantDetails[user.uid].name,
        senderImage: currentThread.participantDetails[user.uid].image,
        type: 'message',
        message: newMessage.trim(),
        threadId: selectedThreadId,
        read: false,
        seen: false,
        createdAt: new Date().toISOString(),
        userType: 'client',
        threadName: currentThread.participantDetails[user.uid].name
      };

      await Promise.all([
        setDoc(messageRef, message),
        setDoc(threadRef, {
          lastMessage: {
            content: newMessage.trim(),
            senderId: user.uid,
            createdAt: new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        }, { merge: true }),
        setDoc(notificationRef, notification)
      ]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Messages List */}
      <div className="col-span-12 lg:col-span-4">
        <Card className="p-4">
          <div className="relative mb-4">
            <Input 
              placeholder="Search messages..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <div className="space-y-2">
            {filteredThreads.length > 0 ? (
              filteredThreads.map(thread => {
                const otherParticipant = thread.participants.find(p => p !== user?.uid);
                if (!otherParticipant) return null;
                
                const participantDetails = thread.participantDetails[otherParticipant];
                
                return (
                  <div
                    key={thread.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedThreadId === thread.id 
                        ? 'bg-[#3F0052] text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedThreadId(thread.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={participantDetails.image} />
                        <AvatarFallback>{participantDetails.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{participantDetails.name}</p>
                        <p className="text-sm truncate opacity-70">
                          {thread.lastMessage?.content}
                        </p>
                      </div>
                      {thread.lastMessage && (
                        <span className="text-xs opacity-50">
                          {format(new Date(thread.lastMessage.createdAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-2xl p-8">
                  <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-md">
                    <MessageSquare className="w-6 h-6 text-[#3F0052]" />
                  </div>
                  <h3 className="text-lg font-light text-[#3F0052] mb-2 tracking-normal">
                    No Messages Yet
                  </h3>
                  <p className="text-gray-600 tracking-normal text-sm">
                    Messages from your stylists will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Message Thread */}
      <div className="col-span-12 lg:col-span-8">
        <Card className="p-4 h-[calc(100vh-13rem)]">
          <div className="flex flex-col h-full">
            {selectedThreadId ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map(message => {
                    const isSender = message.senderId === user?.uid;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[70%] ${isSender ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.senderImage} />
                            <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className={`rounded-lg p-3 ${
                              isSender 
                                ? 'bg-[#3F0052] text-white' 
                                : 'bg-gray-100'
                            }`}>
                              {message.content}
                            </div>
                            <div className={`text-xs mt-1 ${isSender ? 'text-right' : ''}`}>
                              {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="mt-4 border-t pt-4">
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Type a message..." 
                      className="flex-1"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-[#3F0052]" />
                  </div>
                  <h3 className="text-xl font-light text-[#3F0052] mb-2 tracking-normal">
                    Select a Conversation
                  </h3>
                  <p className="text-gray-600 tracking-normal">
                    Choose a conversation to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
