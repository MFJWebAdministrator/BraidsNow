/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore
import { MassMessageDialog } from '@/components/dashboard/stylist/MassMessageDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/use-auth';
import { useMessages } from '@/hooks/use-messages';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase/config';
import { format } from 'date-fns';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, MessageSquare, Search, Send, Users, Paperclip } from 'lucide-react';
import { useState, useRef } from 'react';
import heic2any from 'heic2any';
import { ImageCropper } from '@/components/ClientCommunity/ImageCropper';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export function MessagesContent() {
  const { user } = useAuth();
  const { threads, messages, loading, selectedThreadId, setSelectedThreadId } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMassMessage, setShowMassMessage] = useState(false);
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [croppingImage, setCroppingImage] = useState<File | null>(null);
  const [croppingQueue, setCroppingQueue] = useState<File[]>([]);
  const filteredThreads = threads.filter(thread => {
    const otherParticipant = thread.participants.find(p => p !== user?.uid);
    if (!otherParticipant) return false;

    const participantDetails = thread.participantDetails[otherParticipant];
    return participantDetails.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSendMessage = async () => {
    if (!user || !selectedThreadId || (!newMessage.trim() && selectedImages.length === 0)) return;

    try {
      setSendingMessage(true);

      const messageRef = doc(collection(db, "messages"));
      const threadRef = doc(db, "messageThreads", selectedThreadId);
      const notificationRef = doc(collection(db, "notifications"));

      const currentThread = threads.find((t) => t.id === selectedThreadId);
      if (!currentThread) return;

      const senderId = user.uid;
      const participants = currentThread.participants || [];
      const [clientId, stylistId] = participants;

      // Check if stylist is favorited
      if (senderId === stylistId) {
        const favoriteRef = doc(db, "favorites", `${clientId}_${stylistId}`);
        const favoriteSnapshot = await getDoc(favoriteRef);

        if (!favoriteSnapshot.exists()) {
          toast({
            title: "Message failed",
            description: "You have to be favourited by the client to message them.",
            variant: "destructive",
          });
          return;
        }
      }

      // Upload images if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await Promise.all(selectedImages.map(async (file) => {
        const imageRef = ref(storage, `profile-images/${user?.uid}/${messageRef.id}-${Date.now()}`);
        await uploadBytes(imageRef, file);
        const downloadUrl = await getDownloadURL(imageRef);
        return downloadUrl
        }));
      }
    
      // Create message
      const message = {
        id: messageRef.id,
        threadId: selectedThreadId,
        content: newMessage.trim(),
        senderId: senderId,
        senderName: currentThread.participantDetails[senderId]?.name || "Unknown",
        senderImage: currentThread.participantDetails[senderId]?.image || "",
        participants: participants,
        readBy: [senderId],
        createdAt: new Date().toISOString(),
        images: imageUrls,
      };

      // Create notification for the client
      const notification = {
        id: notificationRef.id,
        recipientId: clientId,
        senderId: senderId,
        senderName: currentThread.participantDetails[senderId]?.name || "Unknown",
        senderImage: currentThread.participantDetails[senderId]?.image || "",
        type: 'message',
        message: newMessage.trim(),
        threadId: selectedThreadId,
        read: false,
        seen: false,
        createdAt: new Date().toISOString()
      };

      await Promise.all([
        setDoc(messageRef, message),
        setDoc(threadRef, {
          lastMessage: {
            content: newMessage.trim(),
            senderId: senderId,
            createdAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        }, { merge: true }),
        setDoc(notificationRef, notification)
      ]);

      setNewMessage("");
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (error: any) {
      console.error("Error sending message:", error);

      if (error.code === "permission-denied") {
        toast({
          title: "Message failed",
          description: "You have to be favourited by the client to message them.",
          variant: "destructive",
        });
      }
    } finally {
      setSendingMessage(false);
    }
  };

  // Modified handleImageChange to queue images for cropping
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    let newFiles: File[] = [];
    for (let i = 0; i < files.length && selectedImages.length + newFiles.length < 3; i++) {
      let file = files[i];
      // Accept HEIC/HEIF and convert to JPEG/PNG for preview
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.endsWith('.heic') || file.name.endsWith('.HEIC') || file.name.endsWith('.heif') || file.name.endsWith('.HEIF')) {
        try {
          const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
          if (converted instanceof Blob) {
            file = new File([converted], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
          }
        } catch (err) {
          console.error('HEIC conversion failed:', err);
          continue;
        }
      }
      newFiles.push(file);
    }
    // Start cropping the first image in the queue
    if (newFiles.length > 0) {
      setCroppingQueue(newFiles);
      setCroppingImage(newFiles[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle crop complete
  const handleCropComplete = (croppedFile: File) => {
    // Check file size after cropping
    if (croppedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Each image must be less than 5MB after cropping.',
        variant: 'destructive',
      });
      // Move to next image in queue
      const [, ...rest] = croppingQueue;
      if (rest.length > 0) {
        setCroppingQueue(rest);
        setCroppingImage(rest[0]);
      } else {
        setCroppingQueue([]);
        setCroppingImage(null);
      }
      return;
    }
    setSelectedImages(prev => [...prev, croppedFile].slice(0, 3));
    setImagePreviews(prev => [...prev, URL.createObjectURL(croppedFile)].slice(0, 3));
    // Move to next image in queue
    const [, ...rest] = croppingQueue;
    if (rest.length > 0) {
      setCroppingQueue(rest);
      setCroppingImage(rest[0]);
    } else {
      setCroppingQueue([]);
      setCroppingImage(null);
    }
  };

  // Handle crop cancel (skip image)
  const handleCropCancel = () => {
    const [, ...rest] = croppingQueue;
    if (rest.length > 0) {
      setCroppingQueue(rest);
      setCroppingImage(rest[0]);
    } else {
      setCroppingQueue([]);
      setCroppingImage(null);
    }
  };

  // Remove image
  const handleRemoveImage = (idx: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F0052]" />
      </div>
    );
  }

  return (
    <>
      <div className='fixed top-0'>
        <Toaster />
      </div>
      <div className="grid grid-cols-12 gap-6">
        {/* Messages List */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search messages..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button
                variant="outline"
                className="ml-2 "
                onClick={() => setShowMassMessage(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Mass Message
              </Button>
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
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedThreadId === thread.id
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
                      Messages from your clients will appear here
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
                              <div className={`rounded-lg p-3 ${isSender
                                ? 'bg-[#3F0052] text-white'
                                : 'bg-gray-100'
                                }`}>
                                {message.content}
                                {message.images && message.images.length > 0 && (
                                  <div className="mt-2 flex flex-col gap-2">
                                    {message.images.map((image: string, index: number) => (
                                      <a key={index} href={image} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={image}
                                          alt={`Sent image ${index + 1}`}
                                          className="rounded-lg max-w-full h-auto"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}
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
                    <div className="flex gap-2 items-end relative">
                      {/* <div className="absolute left-3 top-1/3 -translate-y-1/2 h-4 w-4 flex flex-col items-center">
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          multiple
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleImageChange}
                          disabled={selectedImages.length >= 3}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          className="p-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={selectedImages.length >= 3}
                          title={selectedImages.length >= 3 ? 'Maximum 3 images' : 'Attach image'}
                        >
                          <Paperclip className="w-5 h-5 text-gray-400" />
                        </Button>
                      </div> */}
                      <Input
                        placeholder="Write a message..."
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
                        disabled={(!newMessage.trim() && selectedImages.length === 0) || sendingMessage}
                        className="ml-2"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {/* Image previews */}
                    {imagePreviews.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {imagePreviews.map((src, idx) => (
                          <div key={idx} className="relative group">
                            <img src={src} alt={`preview-${idx}`} className="max-w-16 max-h-16 object-cover rounded" />
                            <button
                              type="button"
                              className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs hidden group-hover:block"
                              onClick={() => handleRemoveImage(idx)}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

      <MassMessageDialog
        isOpen={showMassMessage}
        onClose={() => setShowMassMessage(false)}
      />

      {croppingImage && (
        <ImageCropper
          image={croppingImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          cropShape="square"
        />
      )}

    </>
  );
}