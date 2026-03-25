import React from 'react';
import { MessageCircle } from 'lucide-react';
import StarRating from './StarRating';

interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId: string;
}

interface ReviewListProps {
  reviews: Review[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (!reviews.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
        <MessageCircle size={28} className="mx-auto mb-3 text-gray-300" />
        No reviews yet. Be the first verified customer to leave one.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review._id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{review.userName}</h4>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <StarRating value={review.rating} size={16} />
          </div>
          <p className="mt-4 text-sm leading-7 text-gray-700">{review.comment}</p>
        </article>
      ))}
    </div>
  );
};

export default ReviewList;
