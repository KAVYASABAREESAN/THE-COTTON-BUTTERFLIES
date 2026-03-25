import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { wishlistService } from '../services/api';

interface WishlistItem {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    stock: number;
  };
  addedAt: string;
}

const WishlistPage: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await wishlistService.getWishlist();
      console.log('Wishlist response:', response);
      setItems(response.items || []);
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
      setError(error.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setItems(items.filter(item => item.product._id !== productId));
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      alert(error.message || 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = (product: any) => {
    alert('Please select color and size on the product details page before adding to cart.');
    navigate(`/product/${product._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">
          My Wishlist ({items.length} items)
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-6">
              Save your favorite items to buy later
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.product._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Link to={`/product/${item.product._id}`}>
                  <div className="aspect-square bg-gradient-to-br from-pink-100 to-blue-100 relative">
                    {item.product.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/product/${item.product._id}`}>
                    <h3 className="font-medium text-gray-900 mb-2 hover:text-pink-600 line-clamp-2">
                      {item.product.name}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{item.product.price.toLocaleString()}
                    </span>
                    {item.product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{item.product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddToCart(item.product)}
                      disabled={item.product.stock === 0}
                      className="flex-1 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {item.product.stock === 0 && (
                    <p className="mt-2 text-sm text-red-600">Out of Stock</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
