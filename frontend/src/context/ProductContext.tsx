import React, { createContext, useContext, useState, useEffect } from 'react';
import { productService } from '../services/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: 'earrings' | 'chains';
  type: string;
  colors: string[];
  sizes: string[];
  images: string[];
  stock: number;
  featured: boolean;
}

interface ProductContextType {
  products: Product[];
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  addProduct: (product: any) => Promise<void>;
  updateProduct: (id: string, product: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

// Filter out blob URLs, placeholders, and empty strings
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

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = async () => {
    try {
      console.log('[ProductContext] refreshProducts:start');
      setLoading(true);
      const response = await productService.getAllProducts({ limit: 100 });
      if (response.status === 'success') {
        const cleaned = (response.data || []).map((p: Product) => ({
          ...p,
          images: cleanImages(p.images)
        }));
        setProducts(cleaned);
        setFeaturedProducts(cleaned.filter((p: Product) => p.featured));
        console.log('[ProductContext] refreshProducts:success', {
          productCount: cleaned.length,
          featuredCount: cleaned.filter((p: Product) => p.featured).length
        });
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('[ProductContext] refreshProducts:error', err);
    } finally {
      setLoading(false);
      console.log('[ProductContext] refreshProducts:end');
    }
  };

  const getProduct = (id: string) => {
    return products.find(p => p._id === id);
  };

  const addProduct = async (productData: any) => {
    try {
      console.log('[ProductContext] addProduct:start', productData);
      const response = await productService.createProduct(productData);
      if (response.status === 'success') {
        console.log('[ProductContext] addProduct:success', response.data);
        await refreshProducts();
      }
    } catch (err) {
      console.error('[ProductContext] addProduct:error', err);
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: any) => {
    try {
      console.log('[ProductContext] updateProduct:start', { id, productData });
      const response = await productService.updateProduct(id, productData);
      if (response.status === 'success') {
        console.log('[ProductContext] updateProduct:success', response.data);
        await refreshProducts();
      }
    } catch (err) {
      console.error('[ProductContext] updateProduct:error', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await productService.deleteProduct(id);
      if (response.status === 'success') {
        await refreshProducts();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  return (
    <ProductContext.Provider value={{
      products,
      featuredProducts,
      loading,
      error,
      refreshProducts,
      getProduct,
      addProduct,
      updateProduct,
      deleteProduct
    }}>
      {children}
    </ProductContext.Provider>
  );
};
