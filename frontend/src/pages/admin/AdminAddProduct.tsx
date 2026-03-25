import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Save, ArrowLeft, Plus } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { uploadService } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const PRESET_COLORS = ['Pink', 'Blue', 'White', 'Black', 'Red', 'Yellow', 'Green', 'Navy', 'Brown Floral', 'Gold', 'Striped'];
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'];
const PRODUCT_TYPES = [
  { value: '', label: 'Select type (optional)' },
  { value: 'dress', label: 'Dress' },
  { value: 'top', label: 'Top' },
  { value: 'shirt', label: 'Shirt' },
  { value: 'pants', label: 'Pants' },
  { value: 'skirt', label: 'Skirt' },
  { value: 'frock', label: 'Frock' },
  { value: 'gown', label: 'Gown' },
  { value: 'saree', label: 'Saree' },
  { value: 'kurta', label: 'Kurta' },
  { value: 'lehenga', label: 'Lehenga' },
  { value: 'other', label: 'Other' },
];
const ACCESSORY_SUBCATEGORIES = [
  { value: '', label: 'Select subcategory' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'chains', label: 'Chains' }
];

const getApiErrorMessage = (error: any) => {
  const fieldErrors = error?.response?.data?.fields;
  if (fieldErrors && typeof fieldErrors === 'object') {
    return Object.values(fieldErrors).join('\n');
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Request failed'
  );
};

const logAdminProduct = (...args: any[]) => {
  console.log('[AdminAddProduct]', ...args);
};

const AdminAddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { addProduct, updateProduct, products } = useProducts();

  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('');
  const [customSize, setCustomSize] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'women',
    subcategory: '',
    type: '',
    colors: [] as string[],
    sizes: [] as string[],
    stock: '',
    featured: false
  });

  // Load existing product data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      logAdminProduct('load_edit_mode:start', { id, productCount: products.length });
      const product = products.find((p: any) => p._id === id || p.id === id);
      if (product) {
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: String(product.price || ''),
          originalPrice: String(product.originalPrice || ''),
          category: product.category || 'women',
          subcategory: product.subcategory || '',
          type: product.type || '',
          colors: product.colors || [],
          sizes: product.sizes || [],
          stock: String(product.stock || ''),
          featured: product.featured || false
        });
        setExistingImages(product.images || []);
        logAdminProduct('load_edit_mode:success', product);
      }
    }
  }, [isEditMode, id, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (name === 'category') {
      setFormData((prev) => ({
        ...prev,
        category: value,
        subcategory: value === 'accessories' ? prev.subcategory : ''
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const toggleColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const addCustomColor = () => {
    const trimmed = customColor.trim();
    if (trimmed && !formData.colors.includes(trimmed)) {
      setFormData(prev => ({ ...prev, colors: [...prev.colors, trimmed] }));
    }
    setCustomColor('');
  };

  const removeColor = (color: string) => {
    setFormData(prev => ({ ...prev, colors: prev.colors.filter(c => c !== color) }));
  };

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const addCustomSize = () => {
    const trimmed = customSize.trim();
    if (trimmed && !formData.sizes.includes(trimmed)) {
      setFormData(prev => ({ ...prev, sizes: [...prev.sizes, trimmed] }));
    }
    setCustomSize('');
  };

  const removeSize = (size: string) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selectedFiles = Array.from(files);
      logAdminProduct('handleImageUpload', selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type
      })));
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setImageFiles(prev => [...prev, ...selectedFiles]);
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      logAdminProduct('handleSubmit:start', {
        isEditMode,
        id,
        formData,
        existingImages,
        imageFiles: imageFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      });

      if (!formData.type.trim()) {
        throw new Error('Product type is required.');
      }

      if (formData.category === 'accessories' && !formData.subcategory) {
        throw new Error('Select an accessory subcategory.');
      }

      if (formData.colors.length === 0) {
        throw new Error('Select at least one color.');
      }

      if (!isEditMode && imageFiles.length === 0) {
        throw new Error('Upload at least one product image.');
      }

      if (isEditMode && existingImages.length === 0 && imageFiles.length === 0) {
        throw new Error('Keep or upload at least one product image.');
      }

      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        logAdminProduct('handleSubmit:upload:start', { imageCount: imageFiles.length });
        const uploadResponse = await uploadService.uploadImages(imageFiles, {
          category: formData.category
        });
        uploadedImageUrls = (uploadResponse?.urls || []).map((img: any) => img.url);
        logAdminProduct('handleSubmit:upload:success', uploadedImageUrls);
      }

      const allImages = [...existingImages, ...uploadedImageUrls];

      const productData = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        stock: Number(formData.stock),
        images: allImages
      };

      logAdminProduct('handleSubmit:payload', productData);

      if (isEditMode && id) {
        await updateProduct(id, productData);
        showSuccessToast('Product updated successfully');
      } else {
        await addProduct(productData);
        showSuccessToast('Product added successfully');
      }

      logAdminProduct('handleSubmit:success');
      navigate('/admin/products');
    } catch (error) {
      console.error('[AdminAddProduct] handleSubmit:error', error);
      showErrorToast(error, getApiErrorMessage(error));
    } finally {
      setLoading(false);
      logAdminProduct('handleSubmit:end');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-light text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Update product details' : 'Create a new product listing'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., Embroidered Puff-Sleeve Maxi Dress"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Product description..."
              />
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="4999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹)</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="6999"
                />
              </div>
            </div>

            {/* Category, Subcategory, Type, Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory {formData.category === 'accessories' ? '*' : ''}
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={formData.category !== 'accessories'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  {ACCESSORY_SUBCATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {PRODUCT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colors *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.colors.includes(color)
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-pink-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {/* Custom color input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomColor())}
                  placeholder="Add custom color..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={addCustomColor}
                  className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {/* Selected colors */}
              {formData.colors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.colors.map(color => (
                    <span key={color} className="flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-700 rounded-full text-xs border border-pink-200">
                      {color}
                      <button type="button" onClick={() => removeColor(color)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                      formData.sizes.includes(size)
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-pink-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {/* Custom size input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSize}
                  onChange={e => setCustomSize(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                  placeholder="Add custom size..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {/* Selected sizes */}
              {formData.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sizes.map(size => (
                    <span key={size} className="flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-700 rounded-full text-xs border border-pink-200">
                      {size}
                      <button type="button" onClick={() => removeSize(size)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Featured */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Mark as Featured Product</span>
              </label>
            </div>
          </div>

          {/* Right Column - Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images *</label>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Current Images</p>
                <div className="grid grid-cols-2 gap-2">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg bg-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-500 transition-colors mb-4">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer block">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-500">Click to upload images</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
              </label>
            </div>

            {/* New image previews */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddProduct;
