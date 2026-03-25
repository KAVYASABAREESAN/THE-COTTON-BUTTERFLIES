import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Truck, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCart } from '../store/slices/cartSlice';
import { orderService, addressService, cartService } from '../services/api';
import { usePublicSettings } from '../context/PublicSettingsContext';

interface Address {
  _id: string;
  type: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CHECKOUT_SELECTION_KEY = 'checkoutSelection';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { settings } = usePublicSettings();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);

  const getItemKey = (item: any) => `${item.id}-${item.size}-${item.color}`;

  useEffect(() => {
    const savedSelection = sessionStorage.getItem(CHECKOUT_SELECTION_KEY);

    if (!savedSelection) {
      navigate('/cart');
      return;
    }

    try {
      const parsedSelection = JSON.parse(savedSelection);
      if (!Array.isArray(parsedSelection) || parsedSelection.length === 0) {
        navigate('/cart');
        return;
      }

      setSelectedItemKeys(parsedSelection);
    } catch (error) {
      console.error('Invalid checkout selection:', error);
      navigate('/cart');
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemKeys.includes(getItemKey(item))),
    [items, selectedItemKeys]
  );

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const shippingCost =
    selectedItems.length === 0
      ? 0
      : subtotal >= settings.shipping.freeDeliveryAbove
        ? 0
        : settings.shipping.deliveryCharges;
  const finalAmount = subtotal + shippingCost;
  const symbol = settings.payment.currencySymbol || '₹';
  const onlinePaymentEnabled = settings.payment.onlinePaymentEnabled;
  const codEnabled = settings.payment.codEnabled;

  useEffect(() => {
    if (selectedItemKeys.length > 0 && selectedItems.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
  }, [navigate, orderPlaced, selectedItemKeys.length, selectedItems.length]);

  useEffect(() => {
    if (paymentMethod === 'razorpay' && !onlinePaymentEnabled && codEnabled) {
      setPaymentMethod('cod');
    }
    if (paymentMethod === 'cod' && !codEnabled && onlinePaymentEnabled) {
      setPaymentMethod('razorpay');
    }
  }, [paymentMethod, onlinePaymentEnabled, codEnabled]);

  const fetchAddresses = async () => {
    try {
      const response = await addressService.getAddresses();
      setAddresses(response.data || []);

      const defaultAddr = response.data?.find((addr: Address) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr._id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const buildOrderData = () => ({
    items: selectedItems.map(item => ({
      product: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: item.image
    })),
    shippingAddress: addresses.find(a => a._id === selectedAddress),
    paymentMethod,
    subtotal,
    shippingCost,
    tax: 0,
    discount: 0,
    total: finalAmount,
    notes: ''
  });

  const removePurchasedItemsFromCart = async () => {
    for (const item of selectedItems) {
      await cartService.removeFromCart(item.id, item.size, item.color);
    }

    const updatedCart = await cartService.getCart();
    dispatch(
      setCart({
        items: updatedCart?.items || [],
        total: updatedCart?.total || 0,
        itemCount: updatedCart?.itemCount || 0
      })
    );

    sessionStorage.removeItem(CHECKOUT_SELECTION_KEY);
  };

  const createStoreOrder = async (orderData: any) => {
    const response = await orderService.createOrder(orderData);

    if (response.status === 'success') {
      setOrderId(response.data.orderId);
      setOrderPlaced(true);
      await removePurchasedItemsFromCart();
      setTimeout(() => {
        navigate('/my-orders');
      }, 3000);
    }
  };

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please select items from cart before checkout');
      navigate('/cart');
      return;
    }

    if (!selectedAddress) {
      alert('Please select a shipping address');
      return;
    }

    setLoading(true);

    try {
      const orderData = buildOrderData();

      if (paymentMethod === 'razorpay') {
        if (!onlinePaymentEnabled) {
          throw new Error('Online payment is currently disabled.');
        }
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Razorpay SDK failed to load. Please try again.');
        }

        const rpResponse = await orderService.createRazorpayOrder(
          finalAmount,
          `receipt_${Date.now()}`
        );

        if (rpResponse.status !== 'success' || !rpResponse.data?.order) {
          throw new Error('Unable to initialize Razorpay order');
        }

        const razorpayOrder = rpResponse.data.order;
        const key = rpResponse.data.key || process.env.REACT_APP_RAZORPAY_KEY_ID;

        if (!key) {
          throw new Error('Razorpay key is missing in frontend configuration');
        }

        const options = {
          key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: settings.general.storeName || 'The Cotton Butterflies',
          description: 'Order payment',
          order_id: razorpayOrder.id,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: {
            color: '#ec4899'
          },
          handler: async (response: any) => {
            try {
              await orderService.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              await createStoreOrder({
                ...orderData,
                paymentMethod: 'razorpay',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
            } catch (verifyError: any) {
              console.error('Razorpay verification failed:', verifyError);
              alert(
                verifyError?.response?.data?.message ||
                  verifyError?.message ||
                  'Payment verification failed'
              );
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          }
        };

        const rzpay = new window.Razorpay(options);
        rzpay.on('payment.failed', (failureResponse: any) => {
          console.error('Razorpay payment failed:', failureResponse);
          alert('Payment failed. Please try again.');
          setLoading(false);
        });
        rzpay.open();
        return;
      }

      await createStoreOrder(orderData);
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to place order. Please try again.');
    } finally {
      if (paymentMethod !== 'razorpay') {
        setLoading(false);
      }
    }
  };

  const handleAddNewAddress = () => {
    if (!isAuthenticated) {
      alert('Please login to add a new address.');
      return;
    }
    navigate('/account?tab=addresses');
  };

  if (selectedItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom max-w-2xl text-center">
          <h1 className="text-3xl font-serif font-light text-gray-900 mb-4">
            No items selected
          </h1>
          <p className="text-gray-600 mb-8">
            Select the items you want from the cart before proceeding to checkout.
          </p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom max-w-2xl text-center">
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-serif font-light text-gray-900 mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600 mb-2">
              Your order ID is: <span className="font-bold text-pink-600">{orderId}</span>
            </p>
            <p className="text-gray-500 mb-8">
              You will be redirected to your orders page shortly.
            </p>
            <button
              onClick={() => navigate('/my-orders')}
              className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-6xl">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Cart
        </button>

        <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">No addresses saved</p>
                  <button
                    onClick={handleAddNewAddress}
                    className="text-pink-500 hover:text-pink-600 font-medium"
                  >
                    Add New Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddress === address._id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address._id}
                          checked={selectedAddress === address._id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{address.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                              {address.type}
                            </span>
                            {address.isDefault && (
                              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">
                            {address.street}<br />
                            {address.city}, {address.state} - {address.zip}<br />
                            {address.country}<br />
                            Phone: {address.phone}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}

                  <button
                    onClick={handleAddNewAddress}
                    className="text-pink-500 hover:text-pink-600 text-sm font-medium mt-2"
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {selectedAddress && step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600"
                >
                  Continue to Payment
                </button>
              )}
            </div>

            {step >= 2 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  <label className={`block p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={!codEnabled}
                      />
                      <div>
                        <span className="font-medium text-gray-900">Cash on Delivery {!codEnabled ? '(Disabled)' : ''}</span>
                        <p className="text-sm text-gray-500">Pay when you receive your order</p>
                      </div>
                    </div>
                  </label>

                  <label className={`block p-4 border-2 rounded-lg cursor-pointer ${
                    paymentMethod === 'razorpay'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={!onlinePaymentEnabled}
                      />
                      <div>
                        <span className="font-medium text-gray-900">Razorpay {!onlinePaymentEnabled ? '(Disabled)' : ''}</span>
                        <p className="text-sm text-gray-500">Pay online with cards, UPI, or netbanking</p>
                      </div>
                    </div>
                  </label>
                  {!codEnabled && !onlinePaymentEnabled && (
                    <p className="text-sm text-red-600">All payment methods are disabled by admin. Please contact support.</p>
                  )}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!codEnabled && !onlinePaymentEnabled}
                    className="flex-1 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step >= 3 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">Review Order</h2>
                </div>

                <div className="space-y-4">
                  <div className="max-h-60 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <div key={getItemKey(item)} className="flex gap-3 py-2 border-b">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-blue-100 rounded flex-shrink-0">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading || (!codEnabled && !onlinePaymentEnabled)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          {paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 'Place Order (COD)'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({itemCount})</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 && selectedItems.length > 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'Free' : `₹${shippingCost.toLocaleString()}`}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-gray-500">
                    Add {symbol}{Math.max(settings.shipping.freeDeliveryAbove - subtotal, 0).toLocaleString()} more for free shipping
                  </p>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-xl">
                    ₹{finalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-2">
                <p className="flex items-center gap-2">
                  <Truck size={14} />
                  Free shipping on orders above {symbol}{settings.shipping.freeDeliveryAbove}
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard size={14} />
                  {codEnabled ? 'Cash on Delivery available' : 'Cash on Delivery disabled'}
                </p>
                <p className="text-xs text-gray-500">Delivery ETA: {settings.shipping.estimatedDeliveryTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
