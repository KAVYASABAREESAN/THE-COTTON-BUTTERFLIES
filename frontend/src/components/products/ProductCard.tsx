import React, { useState } from 'react';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../data/products';
import { wishlistService } from '../../services/api';
import TryOnModal from '../tryon/TryOnModal';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { usePublicSettings } from '../../context/PublicSettingsContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { settings } = usePublicSettings();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
      showErrorToast(new Error('Please login to add items to wishlist'));
      return;
    }

    try {
      await wishlistService.addToWishlist(product.id);
      showSuccessToast(`Added ${product.name} to wishlist`);
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      showErrorToast(error, error.message || 'Failed to add to wishlist');
    }
  };

  const handleTryOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTryOnOpen(true);
  };

  const getGradient = (type: string, category: string) => {
    const gradients: { [key: string]: string } = {
      dress: 'from-pink-100 via-pink-50 to-white',
      gown: 'from-purple-100 via-purple-50 to-white',
      shirt: 'from-blue-100 via-blue-50 to-white',
      top: 'from-yellow-100 via-yellow-50 to-white',
      skirt: 'from-green-100 via-green-50 to-white',
      pants: 'from-indigo-100 via-indigo-50 to-white',
      frock: 'from-pink-200 via-pink-100 to-white'
    };
    const catLower = category.toLowerCase();
    if (gradients[type]) {
      return gradients[type];
    }
    if (catLower === 'kids') {
      return 'from-blue-100 to-white';
    }
    if (catLower === 'accessories') {
      return 'from-amber-100 via-orange-50 to-white';
    }
    return 'from-pink-100 to-white';
  };

  const colorMap: { [key: string]: string } = {
    Pink: 'bg-pink-500',
    Blue: 'bg-blue-500',
    White: 'bg-gray-300 border border-gray-400',
    Black: 'bg-gray-900',
    'Brown Floral': 'bg-amber-800',
    Red: 'bg-red-500',
    Navy: 'bg-blue-900',
    Yellow: 'bg-yellow-400',
    Green: 'bg-green-500',
    Gold: 'bg-yellow-500',
    Striped: 'bg-gradient-to-r from-blue-400 to-white'
  };

  const calculateDiscount = () => {
    if (product.discount) return product.discount;
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return null;
  };

  const discount = calculateDiscount();
  const gradientClass = getGradient(product.type, product.category);
  const isOutOfStock = settings.product.stockTrackingEnabled && product.stock === 0;
  const threshold = settings.product.lowStockThreshold || 10;
  const isLowStock = settings.product.lowStockAlertEnabled && product.stock > 0 && product.stock <= threshold;
  const supportsTryOn =
    settings.aiFeatures.virtualTryOnEnabled && product.category?.toLowerCase() === 'accessories';

  const productImage = product.images?.[0];
  const hasRealImage = productImage &&
    !productImage.startsWith('blob:') &&
    !productImage.includes('/api/placeholder') &&
    !imgError;

  const getCategoryText = () => {
    const cat = product.category || '';
    if (cat.toLowerCase() === 'women') return 'Women';
    if (cat.toLowerCase() === 'kids') return 'Kids';
    if (cat.toLowerCase() === 'accessories') return 'Accessories';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <>
      <div className="group">
        <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl">
          <Link
            to={`/product/${product.id}`}
            aria-label={`View details for ${product.name}`}
            className="absolute inset-0 z-0"
          />

          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} transition-transform duration-500 group-hover:scale-110`}></div>

          {hasRealImage && (
            <img
              src={productImage}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

          {discount && discount > 0 && (
            <div className="absolute left-4 top-4 z-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
              {discount}% OFF
            </div>
          )}

          <div className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium capitalize text-gray-900 backdrop-blur-sm">
            {product.type}
          </div>

          {isLowStock && !isOutOfStock && (
            <div className="absolute right-4 top-16 z-10 rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
              {product.stock} left
            </div>
          )}

          {settings.product.stockTrackingEnabled && isOutOfStock && (
            <div className="absolute right-4 top-16 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
              Out of Stock
            </div>
          )}

          <button
            type="button"
            className="absolute right-4 top-28 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
            onClick={handleAddToWishlist}
          >
            <Heart size={18} className="text-gray-600" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/40 to-transparent p-6 transition-transform duration-300 translate-y-0 md:translate-y-full md:group-hover:translate-y-0">
            <div className="space-y-3">
              {supportsTryOn && (
                <button
                  type="button"
                  onClick={handleTryOn}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-3 font-semibold text-gray-900 shadow-lg transition-colors hover:bg-amber-300"
                >
                  <Sparkles size={18} />
                  Try On
                </button>
              )}

              {!isOutOfStock && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 font-medium text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
                >
                  <ShoppingBag size={18} />
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              {getCategoryText()}
            </span>
            {isLowStock && !isOutOfStock && (
              <span className="rounded bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                {product.stock} left
              </span>
            )}
          </div>

          <Link to={`/product/${product.id}`}>
            <h4 className="mb-2 min-h-[3rem] line-clamp-2 font-medium text-gray-900 transition-colors hover:text-gray-700">
              {product.name}
            </h4>
          </Link>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">
                {settings.payment.currencySymbol} {product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {settings.payment.currencySymbol} {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="flex -space-x-2">
                {product.colors.slice(0, 3).map((color, i) => (
                  <div
                    key={i}
                    className={`h-6 w-6 rounded-full border-2 border-white ${colorMap[color] || 'bg-gray-300'}`}
                    title={color}
                  ></div>
                ))}
                {product.colors.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100">
                    <span className="text-xs text-gray-500">+{product.colors.length - 3}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {settings.product.sizeSelectionEnabled && product.sizes && product.sizes.length > 0 && (
            <div className="mb-3 flex items-center gap-1">
              <span className="text-xs text-gray-500">Sizes:</span>
              <div className="flex gap-1">
                {product.sizes.slice(0, 3).map((size) => (
                  <span key={size} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                    {size}
                  </span>
                ))}
                {product.sizes.length > 3 && (
                  <span className="text-xs text-gray-500">+{product.sizes.length - 3}</span>
                )}
              </div>
            </div>
          )}

          {product.ageGroups && product.ageGroups.length > 0 && (
            <div className="mb-3 flex items-center gap-1">
              <span className="text-xs text-gray-500">Ages:</span>
              <div className="flex gap-1">
                {product.ageGroups.slice(0, 2).map((age) => (
                  <span key={age} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                    {age}
                  </span>
                ))}
                {product.ageGroups.length > 2 && (
                  <span className="text-xs text-gray-500">+{product.ageGroups.length - 2}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">(42)</span>
            {settings.product.stockTrackingEnabled && isOutOfStock && (
              <span className="ml-auto text-xs font-medium text-red-600">Out of Stock</span>
            )}
          </div>
        </div>
      </div>

      <TryOnModal
        isOpen={isTryOnOpen}
        productName={product.name}
        productImages={product.images || []}
        subcategory={(product as any).subcategory}
        productCategory={product.category}
        onClose={() => setIsTryOnOpen(false)}
      />
    </>
  );
};

export default ProductCard;
