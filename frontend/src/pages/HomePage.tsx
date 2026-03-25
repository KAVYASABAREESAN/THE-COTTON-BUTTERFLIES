import React, { useEffect, useState, useCallback } from 'react';
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
  images: string[];
  stock: number;
  featured: boolean;
  tags?: string[];
  ageGroups?: string[];
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');
type CategoryKey = 'women' | 'kids' | 'accessories';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categoryCardImages, setCategoryCardImages] = useState<Record<CategoryKey, string>>({
    women: '',
    kids: '',
    accessories: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getFallbackData = useCallback((): Product[] => {
    return [
      {
        id: '1',
        name: 'Embroidered Puff-Sleeve Maxi Dress',
        description: 'Beautiful embroidered maxi dress with puff sleeves, perfect for special occasions.',
        price: 4999,
        originalPrice: 6999,
        discount: 20,
        category: 'women',
        type: 'dress',
        colors: ['Pink', 'Blue'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        images: [],
        stock: 15,
        featured: true,
        tags: ['dress', 'maxi', 'embroidery', 'puff-sleeve', 'women']
      },
      {
        id: '2',
        name: 'Lace-Trim V-Neck Crepe Maxi Dress',
        description: 'Elegant crepe maxi dress with delicate lace trim and V-neck design.',
        price: 3499,
        originalPrice: 5999,
        discount: 40,
        category: 'women',
        type: 'dress',
        colors: ['Black', 'Brown Floral'],
        sizes: ['XS', 'S', 'M', 'L'],
        images: [],
        stock: 8,
        featured: true,
        tags: ['dress', 'maxi', 'lace', 'v-neck', 'crepe', 'women']
      },
      {
        id: '3',
        name: 'Kids Floral Print Frock',
        description: 'Adorable floral print frock for little girls, perfect for parties.',
        price: 2499,
        category: 'kids',
        type: 'frock',
        colors: ['Pink', 'Yellow'],
        sizes: [],
        ageGroups: ['2-3', '4-5', '6-7'],
        images: [],
        stock: 20,
        featured: true,
        tags: ['kids', 'frock', 'floral', 'dress', 'girls']
      },
      {
        id: '4',
        name: 'Linen Blend Shirt',
        description: 'Comfortable linen-blend shirt for casual everyday wear.',
        price: 3299,
        category: 'women',
        type: 'shirt',
        colors: ['White', 'Blue'],
        sizes: ['XS', 'S', 'M', 'L'],
        images: [],
        stock: 25,
        featured: true,
        tags: ['shirt', 'linen', 'casual', 'women']
      },
    ];
  }, []);

  // Filter out invalid image URLs
  const cleanImages = (images: string[]): string[] => {
    if (!images || !Array.isArray(images)) return [];
    return images.filter(img =>
      img &&
      typeof img === 'string' &&
      !img.startsWith('blob:') &&
      !img.includes('/api/placeholder') &&
      img.trim() !== ''
    );
  };

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getFeaturedProducts();

      if (response.status === 'success') {
        const products: Product[] = (response.data?.products || response.data || []).map((apiProduct: ApiProduct) => ({
          id: apiProduct._id,
          name: apiProduct.name,
          description: apiProduct.description || `${apiProduct.type} for ${apiProduct.category}`,
          price: apiProduct.price,
          originalPrice: apiProduct.originalPrice,
          discount: apiProduct.discount,
          category: apiProduct.category,
          subcategory: apiProduct.subcategory,
          type: apiProduct.type as Product['type'],
          colors: apiProduct.colors || [],
          sizes: apiProduct.sizes || [],
          ageGroups: apiProduct.ageGroups || [],
          images: cleanImages(apiProduct.images),  // clean invalid URLs
          stock: apiProduct.stock || 0,
          featured: apiProduct.featured || false,
          tags: apiProduct.tags || [apiProduct.type, apiProduct.category]
        }));
        setFeaturedProducts(products);
      } else {
        setError(response.message || 'Failed to load products');
        setFeaturedProducts(getFallbackData());
      }
    } catch (fetchError) {
      console.error('Error fetching products:', fetchError);
      setError('Cannot connect to server. Showing demo products.');
      setFeaturedProducts(getFallbackData());
    } finally {
      setLoading(false);
    }
  }, [getFallbackData]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    const fetchLatestCategoryImages = async () => {
      try {
        const categories: CategoryKey[] = ['women', 'kids', 'accessories'];
        const responses = await Promise.all(
          categories.map((category) =>
            productService.getAllProducts({
              category,
              sort: '-createdAt',
              limit: 1,
              page: 1
            })
          )
        );

        const nextImages: Record<CategoryKey, string> = {
          women: '',
          kids: '',
          accessories: ''
        };

        categories.forEach((category, index) => {
          const response = responses[index];
          const products: ApiProduct[] = Array.isArray(response?.data) ? response.data : [];
          const latest = products[0];
          const latestImage = latest?.images?.find((img) => Boolean(img && img.trim()));
          nextImages[category] = resolveImageUrl(latestImage);
        });

        setCategoryCardImages(nextImages);
      } catch (categoryError) {
        console.error('Error fetching latest category images:', categoryError);
      }
    };

    fetchLatestCategoryImages();
  }, []);

  const resolveImageUrl = useCallback((image?: string) => {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
      return image;
    }
    if (image.startsWith('/uploads/')) {
      return `${BACKEND_ORIGIN}${image}`;
    }
    if (image.startsWith('uploads/')) {
      return `${BACKEND_ORIGIN}/${image}`;
    }
    return image;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading featured products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-yellow/30 to-accent-blue/30">
        <div className="container-custom py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-white/80 text-sm font-medium rounded-full mb-6">
              New Spring Collection
            </span>
            <h2 className="text-5xl md:text-6xl font-serif font-light text-gray-900 mb-6">
              Elegance in <span className="font-semibold">Every Thread</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Discover our curated collection of premium women&apos;s wear, kids&apos; styles, and accessories,
              where comfort meets timeless design.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                Shop Collection
              </Link>
              <Link to="/collections" className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:border-gray-400 transition-colors font-medium">
                View Collections
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/20 to-transparent"></div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-serif font-light text-gray-900 mb-4">
              Shop By Category
            </h3>
            <p className="text-gray-600">Curated collections for every occasion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CategoryCard
              title="Women"
              description="Elevated everyday essentials"
              gradient="from-pink-300 via-pink-200 to-pink-100"
              imageUrl={categoryCardImages.women}
              link="/women"
            />
            <CategoryCard
              title="Kids"
              description="Playful and comfortable styles"
              gradient="from-blue-300 via-blue-200 to-blue-100"
              imageUrl={categoryCardImages.kids}
              link="/kids"
            />
            <CategoryCard
              title="Accessories"
              description="Finishing pieces that complete the look"
              gradient="from-amber-300 via-orange-200 to-rose-100"
              imageUrl={categoryCardImages.accessories}
              link="/accessories"
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-gradient-to-br from-stone-900 via-stone-800 to-rose-900 text-white">
        <div className="container-custom">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
                New immersive experience
              </span>
              <h3 className="mt-6 text-4xl font-serif font-light leading-tight">
                Take a virtual walk through The Cotton Butterflies shop.
              </h3>
              <p className="mt-5 text-base leading-7 text-white/75 md:text-lg">
                Explore the boutique in 360°, preview the space, and move through the store before your visit.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/virtual-tour"
                  className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-gray-900 transition hover:bg-rose-50"
                >
                  Enter Virtual Tour
                </Link>
                <a
                  href={`${process.env.PUBLIC_URL}/virtual-tour/index.htm`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open Fullscreen
                </a>
              </div>
            </div>

            <Link to="/virtual-tour" className="group relative block overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-80 transition group-hover:opacity-100" />
              <img
                src={`${process.env.PUBLIC_URL}/virtual-tour/thumbnail.png`}
                alt="The Cotton Butterflies virtual tour preview"
                className="h-[320px] w-full rounded-[1.5rem] object-cover shadow-2xl transition duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/70">360 Experience</p>
                  <p className="mt-2 text-2xl font-serif">Inside the boutique</p>
                </div>
                <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                  View Tour
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-3xl font-serif font-light text-gray-900 mb-2">
                Featured Collections
              </h3>
              <p className="text-gray-600">Best sellers this month</p>
            </div>
            <Link to="/shop" className="text-gray-700 hover:text-gray-900 font-medium">
              View All {'->'}
            </Link>
          </div>

          {error ? (
            <div className="text-center py-12 bg-yellow-50 rounded-lg mb-8">
              <p className="text-yellow-700 mb-2">{error}</p>
              <p className="text-gray-600 text-sm">Showing demo products</p>
            </div>
          ) : null}

          {featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No featured products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl font-serif font-light text-gray-900 mb-4">
              Join Our Butterfly Circle
            </h3>
            <p className="text-gray-600 mb-8">
              Subscribe for exclusive offers, styling tips, and early access to new collections.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="input-field flex-1"
              />
              <button type="button" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              By subscribing, you agree to our Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

const CategoryCard: React.FC<{
  title: string;
  description: string;
  gradient: string;
  imageUrl?: string;
  link: string;
}> = ({ title, description, gradient, imageUrl, link }) => {
  const [activeImageUrl, setActiveImageUrl] = useState(imageUrl || '');
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(activeImageUrl) && !imageError;

  useEffect(() => {
    setActiveImageUrl(imageUrl || '');
    setImageError(false);
  }, [imageUrl]);

  return (
  <Link to={link} className="group relative overflow-hidden rounded-2xl">
    <div className={`h-80 bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-105`}>
      {showImage ? (
        <img
          src={activeImageUrl}
          alt={`${title} category`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImageError(true)}
        />
      ) : null}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
    <div className="absolute bottom-0 p-8 text-white">
      <h4 className="text-2xl font-serif mb-2">{title}</h4>
      <p className="text-white/90 mb-4">{description}</p>
      <span className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all duration-300">
        Shop Now
        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </span>
    </div>
  </Link>
);
};

export default HomePage;
