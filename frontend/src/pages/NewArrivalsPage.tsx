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
  category: 'women' | 'kids' | 'accessories';
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
  category: apiProduct.category,
  subcategory: apiProduct.subcategory,
  type: (apiProduct.type as Product['type']) || 'dress',
  colors: apiProduct.colors || [],
  sizes: apiProduct.sizes || [],
  ageGroups: apiProduct.ageGroups || [],
  images: apiProduct.images || [],
  stock: apiProduct.stock || 0,
  featured: apiProduct.featured || false,
  tags: apiProduct.tags || []
});

const NewArrivalsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'women' | 'kids' | 'accessories'>('all');

  const fetchNewArrivals = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: any = {
        sort: '-createdAt',
        page: 1,
        limit: 36
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await productService.getAllProducts(params);
      if (response?.status === 'success') {
        const rawProducts = response?.data || [];
        setProducts(rawProducts.map(adaptProductForCard));
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading new arrivals:', err);
      setError('Failed to load new arrivals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchNewArrivals();
  }, [fetchNewArrivals]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container-custom py-10">
          <h1 className="text-4xl font-serif font-light text-gray-900 mb-2">New Arrivals</h1>
          <p className="text-gray-600 mb-6">Latest additions across women, kids, and accessories collections.</p>

          <div className="flex flex-wrap gap-2">
            {(['all', 'women', 'kids', 'accessories'] as const).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
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
              onClick={fetchNewArrivals}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No new arrivals found right now.</p>
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

export default NewArrivalsPage;
