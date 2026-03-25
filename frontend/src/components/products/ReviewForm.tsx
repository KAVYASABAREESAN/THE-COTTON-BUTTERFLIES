import React, { useEffect, useState } from 'react';
import { productService } from '../../services/api';
import { showSuccessToast } from '../../utils/toast';
import StarRating from './StarRating';

interface EligibleOrder {
  _id: string;
  orderId: string;
  deliveredAt?: string;
  items: Array<{
    name: string;
    quantity: number;
    image?: string;
  }>;
}

interface ReviewFormProps {
  productId: string;
  eligibleOrders: EligibleOrder[];
  onSubmitted: () => Promise<void> | void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, eligibleOrders, onSubmitted }) => {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eligibleOrders.length > 0) {
      setSelectedOrderId(eligibleOrders[0]._id);
    }
  }, [eligibleOrders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrderId) {
      setError('Select a delivered order before submitting your review.');
      return;
    }

    if (comment.trim().length < 3) {
      setError('Please write at least a short review comment.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await productService.addReview({
        productId,
        orderId: selectedOrderId,
        rating,
        comment: comment.trim()
      });
      showSuccessToast('Review submitted successfully');
      setComment('');
      setRating(5);
      await onSubmitted();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-medium text-gray-900">Write a review</h3>
        <p className="mt-1 text-sm text-gray-600">
          Review is available only for products from delivered orders.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Delivered order</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          >
            {eligibleOrders.map((order) => (
              <option key={order._id} value={order._id}>
                {order.orderId}
                {order.deliveredAt ? ` • Delivered ${new Date(order.deliveredAt).toLocaleDateString('en-IN')}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Your rating</label>
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} readonly={false} size={24} />
            <span className="text-sm text-gray-500">{rating} out of 5</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Your review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            placeholder="Tell other shoppers what you liked about the fit, feel, or quality."
          />
          <p className="mt-2 text-xs text-gray-500">{comment.length}/1000 characters</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
