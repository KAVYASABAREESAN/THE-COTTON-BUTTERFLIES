import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface FilterProps {
  categories: string[];
  types: string[];
  colors: string[];
  sizes: string[];
  priceRange: { min: number; max: number };
  selectedFilters: {
    category?: string;
    type?: string;
    color?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

const ProductFilters: React.FC<FilterProps> = ({
  categories,
  types,
  colors,
  sizes,
  priceRange,
  selectedFilters,
  onFilterChange,
  onClearFilters
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    type: true,
    price: true,
    color: true,
    size: true,
    availability: true
  });

  const [localPriceRange, setLocalPriceRange] = useState({
    min: selectedFilters.minPrice || priceRange.min,
    max: selectedFilters.maxPrice || priceRange.max
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...selectedFilters, category });
  };

  const handleTypeChange = (type: string) => {
    onFilterChange({ ...selectedFilters, type });
  };

  const handleColorChange = (color: string) => {
    onFilterChange({ ...selectedFilters, color });
  };

  const handleSizeChange = (size: string) => {
    onFilterChange({ ...selectedFilters, size });
  };

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...localPriceRange, [type]: value };
    setLocalPriceRange(newRange);
  };

  const applyPriceFilter = () => {
    onFilterChange({
      ...selectedFilters,
      minPrice: localPriceRange.min,
      maxPrice: localPriceRange.max
    });
  };

  const handleStockChange = (inStock: boolean) => {
    onFilterChange({ ...selectedFilters, inStock });
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
    'Beige': 'bg-yellow-100',
    'Multicolor': 'bg-gradient-to-r from-red-500 via-blue-500 to-green-500'
  };

  const hasActiveFilters = Object.values(selectedFilters).some(value => 
    value !== undefined && value !== ''
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with clear button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-serif font-medium">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="border-b border-gray-200 py-4">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection('category')}
        >
          <span className="font-medium text-gray-900">Category</span>
          {expandedSections.category ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.category && (
          <div className="mt-4 space-y-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={selectedFilters.category === category}
                  onChange={() => handleCategoryChange(category)}
                  className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-gray-700 capitalize">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Product Types */}
      {types.length > 0 && (
        <div className="border-b border-gray-200 py-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection('type')}
          >
            <span className="font-medium text-gray-900">Product Type</span>
            {expandedSections.type ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.type && (
            <div className="mt-4 space-y-2">
              {types.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={selectedFilters.type === type}
                    onChange={() => handleTypeChange(type)}
                    className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div className="border-b border-gray-200 py-4">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection('price')}
        >
          <span className="font-medium text-gray-900">Price Range</span>
          {expandedSections.price ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.price && (
          <div className="mt-4 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  type="number"
                  value={localPriceRange.min}
                  onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  min={priceRange.min}
                  max={priceRange.max}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  type="number"
                  value={localPriceRange.max}
                  onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  min={priceRange.min}
                  max={priceRange.max}
                />
              </div>
            </div>
            <button
              onClick={applyPriceFilter}
              className="w-full bg-gray-900 text-white py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Colors */}
      {colors.length > 0 && (
        <div className="border-b border-gray-200 py-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection('color')}
          >
            <span className="font-medium text-gray-900">Colors</span>
            {expandedSections.color ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.color && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`relative group ${selectedFilters.color === color ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`}
                  onClick={() => handleColorChange(color)}
                  title={color}
                >
                  <div className={`w-8 h-8 rounded-full ${colorMap[color] || 'bg-gray-300'} mx-auto`}></div>
                  <span className="text-xs text-gray-600 mt-1 block text-center truncate">
                    {color}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="border-b border-gray-200 py-4">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection('size')}
          >
            <span className="font-medium text-gray-900">Sizes</span>
            {expandedSections.size ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.size && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`py-2 border rounded-md text-sm font-medium transition-colors ${
                    selectedFilters.size === size
                      ? 'bg-gray-900 text-white border-gray-900'
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

      {/* Availability */}
      <div className="py-4">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection('availability')}
        >
          <span className="font-medium text-gray-900">Availability</span>
          {expandedSections.availability ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {expandedSections.availability && (
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.inStock || false}
                onChange={(e) => handleStockChange(e.target.checked)}
                className="w-4 h-4 text-gray-900 rounded focus:ring-gray-900"
              />
              <span className="text-gray-700">In Stock Only</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;