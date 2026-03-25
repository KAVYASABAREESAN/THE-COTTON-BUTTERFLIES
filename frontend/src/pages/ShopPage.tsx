import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, X, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/api';

// Define the API Product type (from MongoDB)
interface ApiProduct {
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
}

// Convert API Product to the format expected by ProductCard
const adaptProductForCard = (apiProduct: ApiProduct) => ({
  id: apiProduct._id,
  name: apiProduct.name,
  description: apiProduct.description,
  price: apiProduct.price,
  originalPrice: apiProduct.originalPrice,
  discount: apiProduct.discount,
  category: apiProduct.category as 'women' | 'kids' | 'accessories',
  subcategory: apiProduct.subcategory,
  type: apiProduct.type as any,
  colors: apiProduct.colors,
  sizes: apiProduct.sizes,
  ageGroups: apiProduct.ageGroups,
  images: apiProduct.images,
  stock: apiProduct.stock,
  featured: apiProduct.featured,
  tags: apiProduct.tags,
  createdAt: apiProduct.createdAt
});

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'women' | 'kids' | 'accessories'>(
    (searchParams.get('category') as 'all' | 'women' | 'kids' | 'accessories') || 'all'
  );
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 10000
  ]);
  const [selectedColor, setSelectedColor] = useState<string>(searchParams.get('color') || '');
  const [selectedSize, setSelectedSize] = useState<string>(searchParams.get('size') || '');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Available filter options from API
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  
  // Expanded sections for mobile
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    type: true,
    price: true,
    color: true,
    size: true,
    availability: true
  });

  // Update URL when filters change
  const updateSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedType) params.set('type', selectedType);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 10000) params.set('maxPrice', priceRange[1].toString());
    if (selectedColor) params.set('color', selectedColor);
    if (selectedSize) params.set('size', selectedSize);
    if (inStockOnly) params.set('inStock', 'true');
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== '-createdAt') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [selectedCategory, selectedType, priceRange, selectedColor, selectedSize, inStockOnly, searchQuery, sortBy, currentPage, setSearchParams]);

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Build query parameters
      const params: any = {
        page: currentPage,
        limit: 12,
        sort: sortBy
      };

      // Add search query
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add category filter
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      // Add type filter
      if (selectedType) {
        params.type = selectedType;
      }

      // Add price range
      if (priceRange[0] > 0) {
        params.minPrice = priceRange[0];
      }
      if (priceRange[1] < 10000) {
        params.maxPrice = priceRange[1];
      }

      // Add color filter
      if (selectedColor) {
        params.colors = selectedColor;
      }

      // Add size filter
      if (selectedSize) {
        params.sizes = selectedSize;
      }

      // Add stock filter
      if (inStockOnly) {
        params.inStock = 'true';
      }

      console.log('Fetching with params:', params);
      
      const response = await productService.getAllProducts(params);
      
      if (response.status === 'success') {
        setProducts(response.data);
        setTotalPages(response.pages || 1);
        setTotalProducts(response.total || 0);
        
        // Update available filter options
        if (response.filters) {
          setAvailableTypes(response.filters.types || []);
          setAvailableColors(response.filters.colors || []);
          setAvailableSizes(response.filters.sizes || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedType, priceRange, selectedColor, selectedSize, inStockOnly, searchQuery, sortBy, currentPage]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
    updateSearchParams();
  }, [fetchProducts, updateSearchParams]);

  // Handle filter changes
  const handleCategoryChange = (category: 'all' | 'women' | 'kids' | 'accessories') => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(selectedType === type ? '' : type);
    setCurrentPage(1);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(selectedColor === color ? '' : color);
    setCurrentPage(1);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(selectedSize === size ? '' : size);
    setCurrentPage(1);
  };

  const handlePriceChange = (value: number) => {
    setPriceRange([priceRange[0], value]);
  };

  const handlePriceRangeApply = () => {
    setCurrentPage(1);
  };

  const handleStockChange = () => {
    setInStockOnly(!inStockOnly);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedType('');
    setPriceRange([0, 10000]);
    setSelectedColor('');
    setSelectedSize('');
    setInStockOnly(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  // Color mapping for swatches
  const colorMap: { [key: string]: string } = {
    'Pink': 'bg-pink-500',
    'Blue': 'bg-blue-500',
    'White': 'bg-gray-300',
    'Black': 'bg-gray-900',
    'Brown Floral': 'bg-amber-800',
    'Red': 'bg-red-500',
    'Navy': 'bg-blue-900',
    'Yellow': 'bg-yellow-400',
    'Green': 'bg-green-500',
    'Gold': 'bg-yellow-500',
    'Purple': 'bg-purple-500',
    'Orange': 'bg-orange-500',
    'Gray': 'bg-gray-400',
    'Beige': 'bg-yellow-100'
  };

  // Check if any filter is active
  const hasActiveFilters = selectedCategory !== 'all' || 
    selectedType !== '' || 
    priceRange[0] > 0 || 
    priceRange[1] < 10000 || 
    selectedColor !== '' || 
    selectedSize !== '' || 
    inStockOnly ||
    searchQuery !== '';

  // Generate pagination numbers
  const getPaginationNumbers = (): (number | string)[] => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-8">
          <h1 className="text-4xl font-serif font-light text-gray-900 mb-2">Shop All Products</h1>
          {searchQuery && (
            <div className="mt-2">
              <span className="text-gray-600">Search results for: </span>
              <span className="font-medium text-pink-600">"{searchQuery}"</span>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="ml-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear search
              </button>
            </div>
          )}
          <p className="text-gray-600 mt-2">
            {loading ? 'Loading...' : `${totalProducts} products found`}
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 text-gray-700"
          >
            <Filter size={20} />
            Show Filters
            {hasActiveFilters && (
              <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-pink-500 hover:text-pink-600"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <button
                  className="flex items-center justify-between w-full text-left mb-4"
                  onClick={() => toggleSection('category')}
                >
                  <h4 className="font-medium text-gray-900">Category</h4>
                  {expandedSections.category ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                
                {expandedSections.category && (
                  <div className="space-y-2">
                    {['all', 'women', 'kids', 'accessories'].map((category) => (
                      <button
                        key={category}
                        className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                          selectedCategory === category 
                            ? 'bg-pink-100 text-pink-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => handleCategoryChange(category as any)}
                      >
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Type Filter */}
              {availableTypes.length > 0 && (
                <div className="mb-6 border-b border-gray-200 pb-6">
                  <button
                    className="flex items-center justify-between w-full text-left mb-4"
                    onClick={() => toggleSection('type')}
                  >
                    <h4 className="font-medium text-gray-900">Product Type</h4>
                    {expandedSections.type ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {expandedSections.type && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableTypes.map((type) => (
                        <button
                          key={type}
                          className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                            selectedType === type 
                              ? 'bg-pink-100 text-pink-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => handleTypeChange(type)}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Price Filter */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <button
                  className="flex items-center justify-between w-full text-left mb-4"
                  onClick={() => toggleSection('price')}
                >
                  <h4 className="font-medium text-gray-900">Price Range</h4>
                  {expandedSections.price ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                
                {expandedSections.price && (
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="500"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(parseInt(e.target.value))}
                      onMouseUp={handlePriceRangeApply}
                      onTouchEnd={handlePriceRangeApply}
                      className="w-full accent-pink-500"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Filter */}
              {availableColors.length > 0 && (
                <div className="mb-6 border-b border-gray-200 pb-6">
                  <button
                    className="flex items-center justify-between w-full text-left mb-4"
                    onClick={() => toggleSection('color')}
                  >
                    <h4 className="font-medium text-gray-900">Color</h4>
                    {expandedSections.color ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {expandedSections.color && (
                    <div className="grid grid-cols-4 gap-3">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          className={`relative group ${
                            selectedColor === color ? 'ring-2 ring-pink-500 ring-offset-2' : ''
                          }`}
                          onClick={() => handleColorChange(color)}
                          title={color}
                        >
                          <div className={`w-8 h-8 rounded-full ${colorMap[color] || 'bg-gray-300'} mx-auto`}></div>
                          <span className="text-xs text-gray-600 mt-1 block text-center truncate">
                            {color.length > 8 ? color.substring(0, 6) + '...' : color}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div className="mb-6 border-b border-gray-200 pb-6">
                  <button
                    className="flex items-center justify-between w-full text-left mb-4"
                    onClick={() => toggleSection('size')}
                  >
                    <h4 className="font-medium text-gray-900">Size</h4>
                    {expandedSections.size ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  {expandedSections.size && (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          className={`py-2 border rounded-md text-sm font-medium transition-colors ${
                            selectedSize === size
                              ? 'bg-pink-500 text-white border-pink-500'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handleSizeChange(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Availability Filter */}
              <div>
                <button
                  className="flex items-center justify-between w-full text-left mb-4"
                  onClick={() => toggleSection('availability')}
                >
                  <h4 className="font-medium text-gray-900">Availability</h4>
                  {expandedSections.availability ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                
                {expandedSections.availability && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={handleStockChange}
                      className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                    />
                    <span className="text-gray-700">In Stock Only</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Filters Sidebar - Mobile */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-serif font-medium">Filters</h2>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium text-gray-900">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={() => {
                          handleClearFilters();
                          setShowMobileFilters(false);
                        }}
                        className="text-sm text-pink-500 hover:text-pink-600"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="mb-6 border-b border-gray-200 pb-6">
                    <h4 className="font-medium text-gray-900 mb-4">Category</h4>
                    <div className="space-y-2">
                      {['all', 'women', 'kids', 'accessories'].map((category) => (
                        <button
                          key={category}
                          className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                            selectedCategory === category 
                              ? 'bg-pink-100 text-pink-700 font-medium' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            handleCategoryChange(category as any);
                            setShowMobileFilters(false);
                          }}
                        >
                          {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="mb-6 border-b border-gray-200 pb-6">
                    <h4 className="font-medium text-gray-900 mb-4">Price Range</h4>
                    <div className="space-y-4">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="500"
                        value={priceRange[1]}
                        onChange={(e) => handlePriceChange(parseInt(e.target.value))}
                        onMouseUp={() => {
                          handlePriceRangeApply();
                          setShowMobileFilters(false);
                        }}
                        onTouchEnd={() => {
                          handlePriceRangeApply();
                          setShowMobileFilters(false);
                        }}
                        className="w-full accent-pink-500"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>₹{priceRange[0].toLocaleString()}</span>
                        <span>₹{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Color Filter */}
                  {availableColors.length > 0 && (
                    <div className="mb-6 border-b border-gray-200 pb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Color</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            className={`relative group ${
                              selectedColor === color ? 'ring-2 ring-pink-500 ring-offset-2' : ''
                            }`}
                            onClick={() => {
                              handleColorChange(color);
                              setShowMobileFilters(false);
                            }}
                            title={color}
                          >
                            <div className={`w-8 h-8 rounded-full ${colorMap[color] || 'bg-gray-300'} mx-auto`}></div>
                            <span className="text-xs text-gray-600 mt-1 block text-center truncate">
                              {color}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Filter */}
                  {availableSizes.length > 0 && (
                    <div className="mb-6 border-b border-gray-200 pb-6">
                      <h4 className="font-medium text-gray-900 mb-4">Size</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSizes.map((size) => (
                          <button
                            key={size}
                            className={`py-2 border rounded-md text-sm font-medium transition-colors ${
                              selectedSize === size
                                ? 'bg-pink-500 text-white border-pink-500'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            handleSizeChange(size);
                            setShowMobileFilters(false);
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                  {/* Availability Filter */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-4">Availability</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={() => {
                          handleStockChange();
                          setShowMobileFilters(false);
                        }}
                        className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                      />
                      <span className="text-gray-700">In Stock Only</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600">
                {!loading && (
                  <>
                    Showing {products.length} of {totalProducts} products
                  </>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                {/* View toggle */}
                <div className="flex items-center gap-2 order-2 sm:order-1">
                  <button
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('list')}
                    title="List view"
                  >
                    <List size={20} />
                  </button>
                </div>
                
                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 order-1 sm:order-2 w-full sm:w-auto"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="-name">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-8 text-center">
                <p className="mb-4">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Products */}
            {!loading && !error && (
              <>
                {products.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-4">No products found matching your criteria.</p>
                    <button 
                      className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800"
                      onClick={handleClearFilters}
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                          <ProductCard 
                            key={product._id} 
                            product={adaptProductForCard(product)} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {products.map((product) => (
                          <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row gap-6">
                            <div className="w-full sm:w-48 h-48 bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg flex-shrink-0"></div>
                            <div className="flex-grow">
                              <h3 className="text-xl font-medium text-gray-900 mb-2">{product.name}</h3>
                              <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                              
                              {/* Color and size indicators */}
                              <div className="flex items-center gap-4 mb-4">
                                {product.colors && product.colors.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Colors:</span>
                                    <div className="flex">
                                      {product.colors.slice(0, 3).map((color, i) => (
                                        <div 
                                          key={i} 
                                          className={`w-5 h-5 rounded-full border border-white -ml-1 first:ml-0 ${colorMap[color] || 'bg-gray-300'}`}
                                          title={color}
                                        ></div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {product.sizes && product.sizes.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Sizes:</span>
                                    <span className="text-sm">
                                      {product.sizes.slice(0, 3).join(', ')}
                                      {product.sizes.length > 3 && '...'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                  <span className="text-2xl font-bold text-gray-900">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                  {product.originalPrice && (
                                    <>
                                      <span className="text-gray-400 line-through ml-2">
                                        ₹{product.originalPrice.toLocaleString()}
                                      </span>
                                      <span className="ml-2 text-sm text-green-600 font-medium">
                                        Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                      </span>
                                    </>
                                  )}
                                </div>
                                <button 
                                  className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                                  onClick={() => window.location.href = `/product/${product._id}`}
                                >
                                  View Details
                                </button>
                              </div>
                              
                              {/* Stock indicator */}
                              {product.stock < 10 && product.stock > 0 && (
                                <div className="mt-4 text-sm text-orange-600">
                                  Only {product.stock} left in stock!
                                </div>
                              )}
                              {product.stock === 0 && (
                                <div className="mt-4 text-sm text-red-600 font-medium">
                                  Out of Stock
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-12 flex justify-center">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Previous
                          </button>

                          {getPaginationNumbers().map((page, index) => (
                            <button
                              key={index}
                              onClick={() => typeof page === 'number' && handlePageChange(page)}
                              className={`px-4 py-2 rounded-md ${
                                page === currentPage
                                  ? 'bg-gray-900 text-white'
                                  : page === '...'
                                  ? 'cursor-default'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                              disabled={page === '...'}
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
