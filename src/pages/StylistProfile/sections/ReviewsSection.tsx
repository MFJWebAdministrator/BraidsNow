import { useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useReviews } from '@/hooks/use-reviews';
import { useUserData } from '@/hooks/use-user-data';
import { reviewSchema, reviewResponseSchema } from '@/lib/schemas/review';
import type { ReviewForm, ReviewResponseForm } from '@/lib/schemas/review';

interface ReviewsSectionProps {
  stylistId: string;
}

export function ReviewsSection({ stylistId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const { userData } = useUserData(user?.uid);
  const { reviews, loading, addReview, respondToReview } = useReviews(stylistId);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState<string | null>(null);

  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: ''
    }
  });

  const responseForm = useForm<ReviewResponseForm>({
    resolver: zodResolver(reviewResponseSchema),
    defaultValues: {
      comment: ''
    }
  });

  const handleSubmitReview = async (data: ReviewForm) => {
    if (!user || !userData) return;

    try {
      await addReview(data, user.uid, `${userData.firstName} ${userData.lastName}`, userData.profileImage);
      setShowReviewDialog(false);
      reviewForm.reset();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleSubmitResponse = async (data: ReviewResponseForm) => {
    if (!showResponseDialog) return;

    try {
      await respondToReview(showResponseDialog, data);
      setShowResponseDialog(null);
      responseForm.reset();
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#3F0052]" />
          <h2 className="text-xl font-light text-[#3F0052] tracking-normal">
            Reviews
          </h2>
        </div>

        {user && user.uid !== stylistId && (
          <Button 
            onClick={() => setShowReviewDialog(true)}
            className="rounded-full"
          >
            Write a Review
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {/* Reviews List */}
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.user.profileImage} />
                  <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#3F0052]">
                      {review.user.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(review.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center mt-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600">{review.comment}</p>

                  {/* Stylist Response */}
                  {review.response ? (
                    <div className="mt-4 pl-4 border-l-2 border-[#3F0052]/20">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[#3F0052]">Stylist Response</p>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(review.response.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{review.response.comment}</p>
                    </div>
                  ) : user?.uid === stylistId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowResponseDialog(review.id)}
                    >
                      Respond to Review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="tracking-normal">No reviews yet</p>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
              Write a Review
            </DialogTitle>
          </DialogHeader>

          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(handleSubmitReview)} className="space-y-4">
              <FormField
                control={reviewForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => field.onChange(rating)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                rating <= field.value
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your review..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Review
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={!!showResponseDialog} onOpenChange={() => setShowResponseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-light tracking-normal text-[#3F0052]">
              Respond to Review
            </DialogTitle>
          </DialogHeader>

          <Form {...responseForm}>
            <form onSubmit={responseForm.handleSubmit(handleSubmitResponse)} className="space-y-4">
              <FormField
                control={responseForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Response</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your response..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResponseDialog(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Response
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}