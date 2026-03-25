import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCart } from '../store/slices/cartSlice';
import { cartService } from '../services/api';

const CHECKOUT_SELECTION_KEY = 'checkoutSelection';

const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, total, itemCount } = useAppSelector((state) => state.cart);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);

  const getItemKey = (item: any) => `${item.id}-${item.size}-${item.color}`;

  useEffect(() => {
    setSelectedItemKeys((prev) =>
      prev.filter((key) => items.some((item) => getItemKey(item) === key))
    );
  }, [items]);

  useEffect(() => {
    sessionStorage.setItem(CHECKOUT_SELECTION_KEY, JSON.stringify(selectedItemKeys));
  }, [selectedItemKeys]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemKeys.includes(getItemKey(item))),
    [items, selectedItemKeys]
  );

  const selectedItemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedShipping = selectedItems.length === 0 ? 0 : selectedSubtotal > 1999 ? 0 : 99;
  const selectedTotal = selectedSubtotal + selectedShipping;
  const isAllSelected = items.length > 0 && selectedItemKeys.length === items.length;

  const toggleItemSelection = (item: any) => {
    const key = getItemKey(item);
    setSelectedItemKeys((prev) =>
      prev.includes(key) ? prev.filter((existingKey) => existingKey !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemKeys([]);
      return;
    }

    setSelectedItemKeys(items.map((item) => getItemKey(item)));
  };

  const handleUpdateQuantity = async (
    e: React.MouseEvent,
    item: any,
    newQuantity: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (newQuantity < 1) return;

    const key = getItemKey(item);
    setLoadingItems((prev) => ({ ...prev, [key]: true }));

    try {
      const updatedCart = await cartService.updateQuantity(
        item.id,
        item.size,
        item.color,
        newQuantity
      );

      dispatch(
        setCart({
          items: updatedCart?.items || [],
          total: updatedCart?.total || 0,
          itemCount: updatedCart?.itemCount || 0,
        })
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveItem = async (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();

    const key = getItemKey(item);
    setLoadingItems((prev) => ({ ...prev, [key]: true }));

    try {
      const updatedCart = await cartService.removeFromCart(
        item.id,
        item.size,
        item.color
      );

      dispatch(
        setCart({
          items: updatedCart?.items || [],
          total: updatedCart?.total || 0,
          itemCount: updatedCart?.itemCount || 0,
        })
      );

      setSelectedItemKeys((prev) => prev.filter((selectedKey) => selectedKey !== key));
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleClearCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        const updatedCart = await cartService.clearCart();
        dispatch(
          setCart({
            items: updatedCart?.items || [],
            total: updatedCart?.total || 0,
            itemCount: updatedCart?.itemCount || 0,
          })
        );
        setSelectedItemKeys([]);
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to proceed to checkout');
      return;
    }

    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-serif font-light text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-md hover:bg-pink-600 transition-colors"
            >
              <ArrowLeft size={20} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">
          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <label className="flex items-center gap-3 text-gray-900 font-medium">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4"
                />
                Select All
              </label>
              <span className="text-sm text-gray-500">
                {selectedItems.length} of {items.length} products selected
              </span>
            </div>

            {items.map((item) => {
              const key = getItemKey(item);
              const isLoading = loadingItems[key];

              return (
                <div
                  key={key}
                  className={`bg-white rounded-lg shadow-sm p-4 flex gap-4 transition-opacity ${
                    isLoading ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedItemKeys.includes(key)}
                      onChange={() => toggleItemSelection(item)}
                      className="h-4 w-4"
                    />
                  </div>

                  <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-blue-100 rounded-lg flex-shrink-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between mb-2">
                      <Link
                        to={`/product/${item.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-pink-600"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveItem(e, item)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="text-sm text-gray-500 mb-2">
                      {item.color && <span>Color: {item.color} | </span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item, item.quantity - 1)}
                          className="p-2 hover:bg-gray-50 transition-colors"
                          disabled={item.quantity <= 1 || isLoading}
                        >
                          <Minus
                            size={16}
                            className={
                              item.quantity <= 1 ? 'text-gray-300' : 'text-gray-600'
                            }
                          />
                        </button>
                        <span className="w-12 text-center text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQuantity(e, item, item.quantity + 1)}
                          className="p-2 hover:bg-gray-50 transition-colors"
                          disabled={isLoading}
                        >
                          <Plus size={16} className="text-gray-600" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearCart}
                className="text-gray-500 hover:text-red-500 text-sm transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Selected ({selectedItemCount} items)</span>
                  <span>₹{selectedSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={selectedShipping === 0 && selectedItems.length > 0 ? 'text-green-600' : ''}>
                    {selectedItems.length === 0
                      ? '₹0'
                      : selectedShipping === 0
                      ? 'Free'
                      : '₹99'}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{selectedTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={selectedItems.length === 0}
                className="block w-full bg-pink-500 text-white text-center py-3 rounded-md hover:bg-pink-600 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/shop"
                className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
