import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, Truck, Shield, Star, ChevronLeft, ChevronRight, ShoppingBag, ArrowLeft, Sparkles } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { setCart } from '../store/slices/cartSlice';
import ProductReviews from '../components/products/ProductReviews';
import { cartService, productService } from '../services/api';
import TryOnModal from '../components/tryon/TryOnModal';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import { usePublicSettings } from '../context/PublicSettingsContext';

// Define Product interface
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subcategory?: 'earrings' | 'chains';
  type: string;
  colors: string[];
  sizes: string[];
  ageGroups?: string[];
  images: string[];
  stock: number;
  featured: boolean;
  tags: string[];
  createdAt: string;
  rating?: number;
  numReviews?: number;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'shipping'>('details');
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isPreviewToolOpen, setIsPreviewToolOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [brushSize, setBrushSize] = useState(36);
  const [canUndoMask, setCanUndoMask] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const patternImageRef = useRef<HTMLImageElement | null>(null);
  const isPaintingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const maskUndoStackRef = useRef<ImageData[]>([]);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { settings } = usePublicSettings();
  const currencySymbol = settings.payment.currencySymbol || '₹';

  // Fetch product data
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (!uploadedImage) return;

    const refreshPattern = async () => {
      await loadPatternTexture(selectedPatternIndex);
      redrawMaskedPreview();
    };

    refreshPattern();
  }, [selectedPatternIndex, uploadedImage]);

  useEffect(() => {
    if (!uploadedImage) return;
    redrawMaskedPreview();
  }, [overlayOpacity, uploadedImage]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(id!);
      if (response.status === 'success') {
        setProduct(response.data.product);
        setRelatedProducts(response.data.relatedProducts || []);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Handle error or no product
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-light mb-6">
            {error || 'Product Not Found'}
          </h1>
          <Link to="/shop" className="btn-primary">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (settings.product.sizeSelectionEnabled && product.sizes.length > 0 && !selectedSize) {
      showErrorToast(new Error('Please select a size'));
      return false;
    }
    
    if (product.colors.length > 0 && !selectedColor) {
      showErrorToast(new Error('Please select a color'));
      return false;
    }

    try {
      const updatedCart = await cartService.addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        quantity,
        size: selectedSize,
        color: selectedColor,
        category: product.category,
        image: product.images[0]
      });

      dispatch(
        setCart({
          items: updatedCart?.items || [],
          total: updatedCart?.total || 0,
          itemCount: updatedCart?.itemCount || 0
        })
      );

      showSuccessToast(`${product.name} added to cart`);
      return true;
    } catch (error: any) {
      console.error('Error adding product to cart:', error);
      showErrorToast(error, error?.response?.data?.message || error?.message || 'Failed to add item to cart');
      return false;
    }
  };

  const handleBuyNow = async () => {
    const added = await handleAddToCart();
    if (added) {
      navigate('/cart');
    }
  };

  const drawFallbackTexture = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(196, 158, 112, 0.28)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(140, 99, 54, 0.35)';
    ctx.lineWidth = 1;
    for (let x = -height; x < width; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });

  const loadPatternTexture = async (patternIndex: number) => {
    const patternSrc = product.images?.[patternIndex];
    if (!patternSrc) {
      patternImageRef.current = null;
      return;
    }

    try {
      patternImageRef.current = await loadImage(patternSrc);
    } catch {
      patternImageRef.current = null;
    }
  };

  const redrawMaskedPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = baseImageRef.current;
    if (!baseImg) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return;

    const patternImg = patternImageRef.current;
    if (patternImg) {
      const repeatPattern = overlayCtx.createPattern(patternImg, 'repeat');
      if (repeatPattern) {
        overlayCtx.fillStyle = repeatPattern;
        overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    } else {
      drawFallbackTexture(overlayCtx, overlayCanvas.width, overlayCanvas.height);
    }

    overlayCtx.globalCompositeOperation = 'destination-in';
    overlayCtx.drawImage(maskCanvas, 0, 0);

    ctx.save();
    ctx.globalAlpha = overlayOpacity;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(overlayCanvas, 0, 0);
    ctx.restore();
  };

  const initializePreviewCanvas = async (uploadedImageSrc: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsGeneratingPreview(true);
      setPreviewError('');
      setIsPreviewReady(false);
      setCanUndoMask(false);

      const userImg = await loadImage(uploadedImageSrc);
      baseImageRef.current = userImg;
      await loadPatternTexture(selectedPatternIndex);

      const maxCanvasWidth = 720;
      const scaledWidth = Math.min(maxCanvasWidth, userImg.width);
      const scaledHeight = Math.round((userImg.height / userImg.width) * scaledWidth);
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement('canvas');
      }

      const maskCanvas = maskCanvasRef.current;
      maskCanvas.width = scaledWidth;
      maskCanvas.height = scaledHeight;

      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) {
        throw new Error('Could not initialize mask canvas');
      }
      maskCtx.clearRect(0, 0, scaledWidth, scaledHeight);

      redrawMaskedPreview();

      const snapshot = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      maskUndoStackRef.current = [snapshot];
    } catch (err) {
      console.error('Preview initialization failed:', err);
      setPreviewError('Could not initialize preview. Please try another image.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPreviewError('Please upload an image file (JPG/PNG/WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        setPreviewError('Failed to read the uploaded image.');
        return;
      }

      setUploadedImage(result);
      initializePreviewCanvas(result);
    };
    reader.onerror = () => {
      setPreviewError('Failed to read the uploaded image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPreview = () => {
    if (!canvasRef.current || !isPreviewReady) return;

    const safeName = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      const downloadLink = document.createElement('a');
      downloadLink.href = canvasRef.current.toDataURL('image/png');
      downloadLink.download = `${safeName}-fabric-preview.png`;
      downloadLink.click();
    } catch {
      setPreviewError('Download failed due to image source restrictions.');
    }
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const paintMaskLine = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.save();
    maskCtx.strokeStyle = 'rgba(255,255,255,1)';
    maskCtx.fillStyle = 'rgba(255,255,255,1)';
    maskCtx.lineJoin = 'round';
    maskCtx.lineCap = 'round';
    maskCtx.lineWidth = brushSize;
    maskCtx.beginPath();
    maskCtx.moveTo(start.x, start.y);
    maskCtx.lineTo(end.x, end.y);
    maskCtx.stroke();
    maskCtx.beginPath();
    maskCtx.arc(end.x, end.y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();
    maskCtx.restore();
  };

  const handleBrushStart = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!uploadedImage || isGeneratingPreview) return;
    const point = getCanvasPoint(event);
    if (!point) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    isPaintingRef.current = true;
    lastPointRef.current = point;
    paintMaskLine(point, point);
    redrawMaskedPreview();
  };

  const handleBrushMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) return;
    const point = getCanvasPoint(event);
    if (!point || !lastPointRef.current) return;

    paintMaskLine(lastPointRef.current, point);
    lastPointRef.current = point;
    redrawMaskedPreview();
  };

  const commitMaskStroke = () => {
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;
    lastPointRef.current = null;

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    const snapshot = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    maskUndoStackRef.current.push(snapshot);
    setCanUndoMask(maskUndoStackRef.current.length > 1);
    setIsPreviewReady(maskUndoStackRef.current.length > 1);
  };

  const handleBrushEnd = () => {
    commitMaskStroke();
  };

  const handleUndoMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx || maskUndoStackRef.current.length <= 1) return;

    maskUndoStackRef.current.pop();
    const previous = maskUndoStackRef.current[maskUndoStackRef.current.length - 1];
    if (!previous) return;
    maskCtx.putImageData(previous, 0, 0);
    setCanUndoMask(maskUndoStackRef.current.length > 1);
    setIsPreviewReady(maskUndoStackRef.current.length > 1);
    redrawMaskedPreview();
  };

  // Gradient mapping for product type
  const getProductGradient = (type: string) => {
    const gradients: { [key: string]: string } = {
      'dress': 'from-pink-100 via-pink-50 to-white',
      'gown': 'from-purple-100 via-purple-50 to-white',
      'shirt': 'from-blue-100 via-blue-50 to-white',
      'top': 'from-yellow-100 via-yellow-50 to-white',
      'skirt': 'from-green-100 via-green-50 to-white',
      'pants': 'from-indigo-100 via-indigo-50 to-white',
      'frock': 'from-pink-200 via-pink-100 to-white',
    };
    return gradients[type] || 'from-gray-100 via-gray-50 to-white';
  };

  // Gradient for color swatches
  const getColorGradient = (color: string) => {
    const gradients: { [key: string]: string } = {
      'Pink': 'from-pink-300 to-pink-200',
      'Blue': 'from-blue-300 to-blue-200',
      'White': 'from-gray-200 to-gray-100',
      'Black': 'from-gray-800 to-gray-700',
      'Brown Floral': 'from-amber-700 to-amber-600',
      'Red': 'from-red-400 to-red-300',
      'Navy': 'from-blue-800 to-blue-700',
      'Yellow': 'from-yellow-300 to-yellow-200',
      'Green': 'from-green-400 to-green-300',
      'Gold': 'from-yellow-500 to-yellow-400',
      'Striped': 'from-blue-300 via-white to-blue-300'
    };
    return gradients[color] || 'from-gray-400 to-gray-300';
  };

  const mainGradient = getProductGradient(product.type);
  const lensSize = 140;
  const zoomLevel = 4;
  const isJewelryProduct =
    product.category?.toLowerCase() === 'accessories' &&
    ['earrings', 'chains'].includes(product.subcategory?.toLowerCase() || '');
  const isPreviewSupported = !isJewelryProduct && settings.aiFeatures.view3dEnabled;

  const supportsTryOn =
    settings.aiFeatures.virtualTryOnEnabled && product.category?.toLowerCase() === 'accessories';

  const handleImageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-yellow/10 to-white">
      <div className="container-custom py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images with Gradient */}
          <div>
            <div className="relative mb-6">
              <div
                className="relative aspect-square rounded-3xl overflow-hidden shadow-lg"
                onMouseEnter={() => setIsZoomActive(true)}
                onMouseLeave={() => setIsZoomActive(false)}
                onMouseMove={handleImageMouseMove}
              >
                {/* Main Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mainGradient}`}></div>
                {product.images?.[activeImage] && (
                  <img
                    src={product.images[activeImage]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[length:20px_20px]"></div>
                
                {/* Discount badge */}
                {product.discount && product.discount > 0 && (
                  <div className="absolute top-6 left-6 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold px-4 py-2 rounded-full shadow-xl z-10">
                    {product.discount}% OFF
                  </div>
                )}
                
                {/* Category badge */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-gray-900 font-medium px-4 py-2 rounded-full capitalize shadow-lg z-10">
                  {product.type}
                </div>

                {/* Zoom lens (desktop only) */}
                {isZoomActive && product.images?.[activeImage] && (
                  <div
                    className="hidden lg:block absolute pointer-events-none border-2 border-white/80 bg-white/20 backdrop-blur-[1px] shadow-lg z-20"
                    style={{
                      width: `${lensSize}px`,
                      height: `${lensSize}px`,
                      left: `calc(${zoomPosition.x}% - ${lensSize / 2}px)`,
                      top: `calc(${zoomPosition.y}% - ${lensSize / 2}px)`
                    }}
                  />
                )}
              </div>

              {/* Right-side zoom preview (desktop only) */}
              {isZoomActive && product.images?.[activeImage] && (
                <div className="hidden lg:block absolute top-0 left-full ml-6 z-30 pointer-events-none">
                  <div className="text-sm font-medium text-gray-700 mb-2">Fabric Texture Zoom</div>
                  <div
                    className="w-[460px] h-[460px] rounded-2xl border border-gray-200 shadow-2xl bg-white overflow-hidden"
                    style={{
                      backgroundImage: `url(${product.images[activeImage]})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: `${zoomLevel * 100}%`,
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Thumbnails with Gradient */}
            <div className="flex gap-4">
              {product.images.map((image, index) => (
                <div 
                  key={index}
                  className={`w-24 h-24 rounded-xl overflow-hidden cursor-pointer border-4 ${activeImage === index ? 'border-gray-900' : 'border-white'} shadow-lg transition-all duration-300 hover:scale-105`}
                  onClick={() => setActiveImage(index)}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} - view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Product Header Card */}
            <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent-pink/30 text-gray-800">
                    {product.category === 'women'
                      ? '👩 Women'
                      : product.category === 'kids'
                      ? '👶 Kids'
                      : product.category === 'accessories'
                      ? '👜 Accessories'
                      : product.category}
                  </span>
                  
                  {/* Rating display */}
                  {product.rating && product.rating > 0 && (
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={16} 
                          className={star <= Math.round(product.rating!) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                          } 
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>
                
                <h1 className="text-4xl font-serif font-light text-gray-900 mb-4">{product.name}</h1>
                <p className="text-gray-600 text-lg">{product.description}</p>
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-r from-white to-accent-pink/10 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-4xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-2xl text-gray-400 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-4 py-2 rounded-full">
                        Save ₹{(product.originalPrice - product.price).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-gray-500">
                  Inclusive of all taxes • Free shipping on orders above {currencySymbol}{settings.shipping.freeDeliveryAbove}
                </p>
              </div>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-gray-900 text-lg">
                    Color: <span className="text-gray-600">{selectedColor || 'Select'}</span>
                  </h3>
                  <span className="text-sm text-gray-500">{product.colors.length} options</span>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`group relative flex flex-col items-center transition-all duration-300 ${
                        selectedColor === color ? 'transform -translate-y-1' : ''
                      }`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <div className={`
                        w-12 h-12 rounded-full mb-2 transition-all duration-300
                        ${selectedColor === color 
                          ? 'ring-2 ring-gray-900 ring-offset-2' 
                          : 'ring-1 ring-gray-200 group-hover:ring-gray-300'
                        }
                      `}>
                        <div className={`
                          w-10 h-10 rounded-full m-1 bg-gradient-to-br ${getColorGradient(color)}
                          ${selectedColor === color ? 'opacity-100' : 'group-hover:opacity-90'}
                        `}></div>
                      </div>
                      <span className={`
                        text-xs font-medium transition-colors duration-200
                        ${selectedColor === color 
                          ? 'text-gray-900 font-semibold' 
                          : 'text-gray-500 group-hover:text-gray-700'
                        }
                      `}>
                        {color}
                        {selectedColor === color && (
                          <span className="block w-2 h-2 bg-gray-900 rounded-full mx-auto mt-1"></span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {settings.product.sizeSelectionEnabled && product.sizes && product.sizes.length > 0 && (
              <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 text-lg">Select Size</h3>
                  <Link to="/size-guide" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
                    Size Guide
                  </Link>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`py-3 rounded-lg font-medium transition-all duration-300 ${selectedSize === size ? 'bg-gray-900 text-white transform scale-105 shadow-lg' : 'bg-white/50 text-gray-700 hover:bg-white hover:shadow-md'}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end">
                {/* Quantity */}
                <div className="flex flex-col">
                  <h3 className="font-medium text-gray-900 mb-4">Quantity</h3>
                  <div className="flex min-h-[54px] items-center border border-gray-300 rounded-xl bg-white/50">
                    <button 
                      type="button"
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 text-xl"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span className="px-6 py-3 border-x border-gray-300 min-w-[80px] text-center text-xl font-medium">
                      {quantity}
                    </span>
                    <button 
                      type="button"
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 text-xl"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="flex flex-col">
                  <h3 className="font-medium text-gray-900 mb-4">Availability</h3>
                  {!settings.product.stockTrackingEnabled || product.stock > settings.product.lowStockThreshold ? (
                    <div className="flex min-h-[54px] items-center gap-3 rounded-xl border border-green-100 bg-green-50/80 px-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">In Stock - Ready to Ship</span>
                    </div>
                  ) : product.stock > 0 ? (
                    <div className="flex min-h-[54px] items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/80 px-4">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-600 font-medium">Only {product.stock} left!</span>
                    </div>
                  ) : (
                    <div className="flex min-h-[54px] items-center gap-3 rounded-xl border border-red-100 bg-red-50/80 px-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>
              </div>

              {supportsTryOn && (
                <button
                  type="button"
                  onClick={() => setIsTryOnOpen(true)}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-amber-400 py-4 font-medium text-gray-900 shadow-lg transition hover:bg-amber-300 hover:shadow-xl"
                >
                  <Sparkles size={20} />
                  Try On
                </button>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <button
                  onClick={handleAddToCart}
                  disabled={settings.product.stockTrackingEnabled && product.stock === 0}
                  className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all duration-300 font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={20} />
                  Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={settings.product.stockTrackingEnabled && product.stock === 0}
                  className="bg-gradient-to-r from-pink-500 to-red-500 text-white py-4 rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>

              {/* Additional Actions */}
              <div className="flex justify-center gap-8 mt-8 pt-8 border-t border-gray-200">
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <Heart size={20} />
                  <span>Wishlist</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Fabric Preview Tool */}
            {isPreviewSupported && (
              <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 text-lg">Try Fabric Pattern</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload your photo to preview this fabric overlay.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewToolOpen((prev) => !prev)}
                  disabled={!isPreviewSupported}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPreviewToolOpen ? 'Hide Preview' : 'Preview'}
                </button>
              </div>

              {isPreviewToolOpen && isPreviewSupported && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Upload Your Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Pattern Selector</label>
                    <div className="flex flex-wrap gap-3">
                      {product.images.slice(0, 6).map((pattern, index) => (
                        <button
                          key={`${pattern}-${index}`}
                          type="button"
                          onClick={() => setSelectedPatternIndex(index)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${selectedPatternIndex === index ? 'border-gray-900' : 'border-gray-200'}`}
                        >
                          <img src={pattern} alt={`Pattern ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Pattern Intensity: {overlayOpacity.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="0.9"
                        step="0.05"
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        Brush Size: {brushSize}px
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="2"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handleBrushStart}
                      onPointerMove={handleBrushMove}
                      onPointerUp={handleBrushEnd}
                      onPointerLeave={handleBrushEnd}
                      onPointerCancel={handleBrushEnd}
                      className="w-full h-auto rounded-lg bg-gray-100 touch-none cursor-crosshair"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Paint only on the clothing area to apply fabric there. Use Undo to correct brush strokes.
                  </p>

                  {isGeneratingPreview && (
                    <p className="text-sm text-gray-600">Generating fabric preview...</p>
                  )}

                  {uploadedImage && isPreviewReady && (
                    <p className="text-sm text-green-600">Preview ready. You can download it now.</p>
                  )}

                  {previewError && (
                    <p className="text-sm text-red-600">{previewError}</p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleUndoMask}
                      disabled={!canUndoMask}
                      className="bg-gray-200 text-gray-800 py-3 px-5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPreview}
                      disabled={!isPreviewReady}
                      className="bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Download Preview Image
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}

            {/* Features Card */}
            <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Truck size={28} className="text-blue-500" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Free Shipping</h4>
                  <p className="text-sm text-gray-600">On orders above ₹1999</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield size={28} className="text-green-500" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Easy Returns</h4>
                  <p className="text-sm text-gray-600">30-day return policy</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="text-2xl">🔒</div>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Secure Payment</h4>
                  <p className="text-sm text-gray-600">100% secure transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section - Fixed: Check if id exists */}
        {id && settings.review.reviewsEnabled && (
          <div id="reviews" className="mt-12 scroll-mt-24">
            <ProductReviews productId={id} />
          </div>
        )}

        {/* Related Products */}
        {settings.aiFeatures.recommendationsEnabled && relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif font-light text-gray-900">You May Also Like</h2>
              <Link to="/shop" className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2">
                View All
                <ChevronRight size={20} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct._id} className="group">
                  <Link to={`/product/${relatedProduct._id}`}>
                    <div className="relative overflow-hidden rounded-2xl mb-4 aspect-square">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getProductGradient(relatedProduct.type)} transition-transform duration-500 group-hover:scale-110`}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </Link>
                  <div className="px-2">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">{relatedProduct.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">₹{relatedProduct.price.toLocaleString()}</span>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900 text-white px-4 py-1 rounded-full text-sm">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TryOnModal
        isOpen={isTryOnOpen}
        productName={product.name}
        productImages={product.images || []}
        subcategory={product.subcategory}
        productCategory={product.category}
        onClose={() => setIsTryOnOpen(false)}
      />
    </div>
  );
};

export default ProductDetailPage;
