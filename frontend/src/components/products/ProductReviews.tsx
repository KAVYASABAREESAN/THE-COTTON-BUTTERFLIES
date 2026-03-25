import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { productService } from '../../services/api';
import ReviewList from './ReviewList';
import StarRating from './StarRating';
import { usePublicSettings } from '../../context/PublicSettingsContext';

interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { settings } = usePublicSettings();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibilityMessage, setEligibilityMessage] = useState(
    'Go to My Orders to review this product after delivery.'
  );

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductReviews(productId);
      if (response.status === 'success') {
        setAverageRating(Number(response.data.averageRating || 0));
        setTotalReviews(Number(response.data.totalReviews || 0));
        setReviews(response.data.reviews || []);
        setEligibilityMessage(
          response.data.eligibility?.message || 'Go to My Orders to review this product after delivery.'
        );
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  if (!settings.review.reviewsEnabled) {
    return (
      <section className="rounded-[2rem] bg-gradient-to-br from-rose-50 via-white to-sky-50 p-6 shadow-sm md:p-8">
        <div className="rounded-2xl bg-white p-6 text-sm text-gray-600 shadow-sm">
          Reviews are currently disabled by admin.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] bg-gradient-to-br from-rose-50 via-white to-sky-50 p-6 shadow-sm md:p-8">
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-gray-500">Reviews</p>
          <div className="mt-5 flex items-end gap-3">
            <span className="text-5xl font-semibold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="pb-1 text-sm text-gray-500">out of 5</span>
          </div>
          {settings.review.starRatingEnabled && <StarRating value={averageRating} className="mt-4" />}
          <p className="mt-3 text-sm text-gray-500">
            {totalReviews} {totalReviews === 1 ? 'verified review' : 'verified reviews'}
          </p>

          <div className="mt-8 space-y-4">
            {isAuthenticated ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                {eligibilityMessage}
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                Please log in and review from My Orders after delivery.
              </div>
            )}
          </div>
        </div>

        <div>
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
              Loading reviews...
            </div>
          ) : (
            <ReviewList reviews={reviews} />
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
