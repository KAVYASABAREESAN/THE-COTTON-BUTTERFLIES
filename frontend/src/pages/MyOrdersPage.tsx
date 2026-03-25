import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Package,
  Truck,
  XCircle
} from 'lucide-react';
import { orderService, productService } from '../services/api';
import StarRating from '../components/products/StarRating';
import { usePublicSettings } from '../context/PublicSettingsContext';
import { showErrorToast, showSuccessToast } from '../utils/toast';

interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface Order {
  _id: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  statusHistory: Array<{
    status: string;
    note?: string;
    timestamp: string;
  }>;
}

interface OrderReviewEntry {
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewDraft {
  rating: number;
  comment: string;
  submitting: boolean;
  error: string;
}

const MyOrdersPage: React.FC = () => {
  const { settings } = usePublicSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderReviewMap, setOrderReviewMap] = useState<Record<string, OrderReviewEntry>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders(currentPage);
      if (response.status === 'success') {
        setOrders(response.data);
        setTotalPages(response.pages);
        if (selectedOrder) {
          const latestSelected = (response.data || []).find((o: Order) => o._id === selectedOrder._id);
          if (latestSelected) {
            setSelectedOrder(latestSelected);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 15000);

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [fetchOrders]);

  useEffect(() => {
    const loadOrderReviews = async () => {
      if (!selectedOrder || selectedOrder.orderStatus !== 'delivered') {
        setOrderReviewMap({});
        setReviewDrafts({});
        return;
      }

      if (!settings.review.reviewsEnabled || !settings.review.starRatingEnabled) {
        setOrderReviewMap({});
        setReviewDrafts({});
        return;
      }

      try {
        const response = await productService.getOrderReviews(selectedOrder._id);
        if (response?.status === 'success') {
          setOrderReviewMap(response.data?.reviews || {});
        }
      } catch (error) {
        console.error('Error fetching order reviews:', error);
      }
    };

    loadOrderReviews();
  }, [selectedOrder, settings.review.reviewsEnabled, settings.review.starRatingEnabled]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'confirmed':
        return <CheckCircle className="text-blue-500" size={20} />;
      case 'processing':
        return <Package className="text-purple-500" size={20} />;
      case 'shipped':
        return <Truck className="text-indigo-500" size={20} />;
      case 'out_for_delivery':
        return <Truck className="text-orange-500" size={20} />;
      case 'delivered':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      case 'refunded':
        return <AlertCircle className="text-gray-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-purple-100 text-purple-700';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-700';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) =>
    status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const getReviewKey = (orderId: string, productId?: string) => `${orderId}:${productId || ''}`;

  const getDraft = (orderId: string, productId?: string): ReviewDraft => {
    const key = getReviewKey(orderId, productId);
    return (
      reviewDrafts[key] || {
        rating: 5,
        comment: '',
        submitting: false,
        error: ''
      }
    );
  };

  const updateDraft = (orderId: string, productId: string, patch: Partial<ReviewDraft>) => {
    const key = getReviewKey(orderId, productId);
    setReviewDrafts((prev) => ({
      ...prev,
      [key]: {
        ...getDraft(orderId, productId),
        ...patch
      }
    }));
  };

  const submitOrderItemReview = async (order: Order, item: OrderItem) => {
    const productId = item.product;
    if (!productId) return;

    const key = getReviewKey(order._id, productId);
    const draft = getDraft(order._id, productId);
    const commentsEnabled = settings.review.commentsEnabled;
    const commentToSubmit = commentsEnabled ? draft.comment.trim() : 'Rating submitted';

    if (commentsEnabled && commentToSubmit.length < 3) {
      updateDraft(order._id, productId, { error: 'Please write at least 3 characters in review.' });
      return;
    }

    try {
      updateDraft(order._id, productId, { submitting: true, error: '' });
      await productService.addReview({
        productId,
        orderId: order._id,
        rating: draft.rating,
        comment: commentToSubmit
      });

      setOrderReviewMap((prev) => ({
        ...prev,
        [productId]: {
          rating: draft.rating,
          comment: commentToSubmit,
          createdAt: new Date().toISOString()
        }
      }));

      setReviewDrafts((prev) => ({
        ...prev,
        [key]: {
          rating: 5,
          comment: '',
          submitting: false,
          error: ''
        }
      }));

      showSuccessToast('Review submitted successfully');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to submit review';
      updateDraft(order._id, productId, { submitting: false, error: message });
      showErrorToast(error, message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Order ID</span>
                      <p className="font-medium text-gray-900">{order.orderId}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Placed on</span>
                      <p className="font-medium text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total</span>
                      <p className="font-medium text-gray-900">Rs {order.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {getStatusText(order.orderStatus)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
                    >
                      <Eye size={18} />
                      View Details
                    </button>
                  </div>

                  <div className="px-6 py-4">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-3 flex-shrink-0">
                          <img
                            src={item.image || '/default-product.png'}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                            onError={(e) => {
                              e.currentTarget.src = '/default-product.png';
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity} × Rs {item.price}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && <div className="text-sm text-gray-500">+{order.items.length - 3} more items</div>}
                    </div>
                  </div>

                  {order.estimatedDelivery && order.orderStatus === 'shipped' && (
                    <div className="bg-blue-50 px-6 py-3 border-t">
                      <p className="text-sm text-blue-700">
                        Estimated delivery by{' '}
                        {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {order.trackingNumber && (
                    <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tracking: {order.trackingNumber}</span>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-pink-600 hover:text-pink-700"
                        >
                          Track Order
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif font-medium">Order Details - {selectedOrder.orderId}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Order Status</h3>
                <div className="flex items-center justify-between">
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status, index) => {
                    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                    const currentIndex = statuses.indexOf(selectedOrder.orderStatus);
                    const isComplete = index <= currentIndex;

                    return (
                      <div key={status} className="flex-1 text-center">
                        <div
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                            isComplete ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle size={16} className="text-white" />
                          ) : (
                            <span className="text-white text-xs">{index + 1}</span>
                          )}
                        </div>
                        <p className={`text-xs mt-2 ${isComplete ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => {
                    const draft = getDraft(selectedOrder._id, item.product);
                    const alreadyReviewed = item.product ? orderReviewMap[item.product] : undefined;

                    return (
                      <div key={index} className="flex gap-4 border-b pb-4">
                        <img
                          src={item.image || '/default-product.png'}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/default-product.png';
                          }}
                        />
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">
                            {item.color && <span>Color: {item.color} | </span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity} × Rs {item.price}</p>

                          {selectedOrder.orderStatus === 'delivered' && item.product && settings.review.reviewsEnabled && settings.review.starRatingEnabled && (
                            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                              {alreadyReviewed ? (
                                <div>
                                  <p className="text-xs font-medium text-green-700">Review submitted</p>
                                  <StarRating value={alreadyReviewed.rating} readonly size={16} className="mt-1" />
                                  {settings.review.commentsEnabled && alreadyReviewed.comment && (
                                    <p className="mt-1 text-xs text-gray-600">{alreadyReviewed.comment}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-amber-800">Rate this delivered product</p>
                                  <StarRating
                                    value={draft.rating}
                                    readonly={false}
                                    size={18}
                                    onChange={(value) => updateDraft(selectedOrder._id, item.product, { rating: value })}
                                  />
                                  {settings.review.commentsEnabled && (
                                    <textarea
                                      value={draft.comment}
                                      onChange={(e) => updateDraft(selectedOrder._id, item.product, { comment: e.target.value })}
                                      rows={2}
                                      className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-xs text-gray-900 placeholder:text-gray-500 outline-none focus:border-amber-400"
                                      placeholder="Share your feedback"
                                    />
                                  )}
                                  {draft.error && <p className="text-xs text-red-600">{draft.error}</p>}
                                  <button
                                    type="button"
                                    onClick={() => submitOrderItemReview(selectedOrder, item)}
                                    disabled={draft.submitting}
                                    className="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                                  >
                                    {draft.submitting ? 'Submitting...' : 'Submit Rating'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedOrder.orderStatus === 'delivered' && item.product && (!settings.review.reviewsEnabled || !settings.review.starRatingEnabled) && (
                            <p className="mt-3 text-xs text-gray-500">Review and rating is currently disabled by admin.</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">Rs {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">Rs {selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">Rs {selectedOrder.shippingCost?.toLocaleString() || '0'}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-Rs {selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-lg">Rs {selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                  <p className="text-gray-600">
                    {selectedOrder.shippingAddress.street}
                    <br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zip}
                    <br />
                    {selectedOrder.shippingAddress.country}
                    <br />
                    Phone: {selectedOrder.shippingAddress.phone}
                  </p>
                </div>
              )}

              {['pending', 'confirmed'].includes(selectedOrder.orderStatus) && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      try {
                        await orderService.cancelOrder(selectedOrder._id);
                        setSelectedOrder(null);
                        fetchOrders();
                        showSuccessToast('Order cancelled successfully');
                      } catch (error) {
                        showErrorToast(error, 'Failed to cancel order');
                      }
                    }
                  }}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
