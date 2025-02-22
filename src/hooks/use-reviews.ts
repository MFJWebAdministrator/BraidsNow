import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from './use-toast';
import type { Review, ReviewForm, ReviewResponseForm } from '@/lib/schemas/review';

export function useReviews(stylistId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const { toast } = useToast();

  // Subscribe to reviews
  useEffect(() => {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('stylistId', '==', stylistId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      setReviews(reviewsData);

      // Calculate average rating
      if (reviewsData.length > 0) {
        const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(Number((total / reviewsData.length).toFixed(1)));
      }

      setLoading(false);
    }, (error) => {
      console.error('Error loading reviews:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [stylistId]);

  const addReview = async (data: ReviewForm, userId: string, userName: string, userImage?: string) => {
    try {
      await addDoc(collection(db, 'reviews'), {
        ...data,
        stylistId,
        userId,
        createdAt: serverTimestamp(),
        user: {
          name: userName,
          profileImage: userImage
        }
      });

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Error adding review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const respondToReview = async (reviewId: string, response: ReviewResponseForm) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        response: {
          comment: response.comment,
          createdAt: serverTimestamp()
        }
      });

      toast({
        title: "Response submitted",
        description: "Your response has been added to the review.",
      });
    } catch (error) {
      console.error('Error responding to review:', error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    reviews,
    loading,
    averageRating,
    addReview,
    respondToReview
  };
}