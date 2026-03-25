import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/api';
import { Product } from '../data/products';

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
}

const adaptProductForCard = (apiProduct: ApiProduct): Product => ({
  id: apiProduct._id,
  name: apiProduct.name,
  description: apiProduct.description,
  price: apiProduct.price,
  originalPrice: apiProduct.originalPrice,
  discount: apiProduct.discount,
  category: 'kids',
  subcategory: apiProduct.subcategory,
  type: (apiProduct.type as Product['type']) || 'frock',
  colors: apiProduct.colors || [],
  sizes: apiProduct.sizes || [],
  ageGroups: apiProduct.ageGroups || [],
  images: apiProduct.images || [],
  stock: apiProduct.stock || 0,
  featured: apiProduct.featured || false,
  tags: apiProduct.tags || []
});

const KidsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');

  const fetchKidsProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await productService.getAllProducts({
        category: 'kids',
        sort: sortBy,
        page: 1,
        limit: 36
      });

      if (response?.status === 'success') {
        const rawProducts = response?.data || [];
        setProducts(rawProducts.map(adaptProductForCard));
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading kids products:', err);
      setError('Failed to load kids collection. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchKidsProducts();
  }, [fetchKidsProducts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container-custom py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-serif font-light text-gray-900 mb-2">Kids Collection</h1>
              <p className="text-gray-600">Colorful, comfortable picks for little ones.</p>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="-createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-8 text-center">
            <p className="mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchKidsProducts}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No products found in kids collection.</p>
            <Link
              to="/shop"
              className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="mb-6 text-gray-600">
              {products.length} products found
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KidsPage;
