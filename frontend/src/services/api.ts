import axios from 'axios';
import { showErrorToast } from '../utils/toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const DEBUG_API = true;

const logApi = (...args: any[]) => {
  if (DEBUG_API) {
    console.log('[api]', ...args);
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const navigateWithoutReload = (path: string) => {
  if (window.location.pathname === path) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logApi('request', {
      method: config.method,
      url: `${config.baseURL}${config.url}`,
      hasToken: Boolean(token),
      params: config.params,
      data: config.data
    });
    return config;
  },
  (error) => {
    logApi('request_error', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    logApi('response', {
      method: response.config.method,
      url: `${response.config.baseURL}${response.config.url}`,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    logApi('response_error', {
      method: error.config?.method,
      url: error.config ? `${error.config.baseURL}${error.config.url}` : undefined,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const currentPath = window.location.pathname;
      const redirectPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login';
      navigateWithoutReload(redirectPath);
      showErrorToast(error, 'Your session has expired. Please log in again.');
    } else if (!(error.config as any)?.suppressToast) {
      showErrorToast(error);
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.status === 'success') {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.status === 'success') {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: (redirectPath = '/login') => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigateWithoutReload(redirectPath);
  },
};

// Product services
export const productService = {
  getAllProducts: async (params?: any) => {
    logApi('productService.getAllProducts', params);
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getFeaturedProducts: async () => {
    const response = await api.get('/products/featured');
    return response.data;
  },

  getProductsByCategory: async (category: string) => {
    const response = await api.get('/products', { params: { category } });
    return response.data;
  },

  getProductReviews: async (productId: string) => {
    const response = await api.get(`/reviews/${productId}`);
    return response.data;
  },

  getOrderReviews: async (orderId: string) => {
    const response = await api.get(`/reviews/order/${orderId}`);
    return response.data;
  },

  addReview: async (reviewData: {
    productId: string;
    orderId: string;
    rating: number;
    comment: string;
  }) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  createProduct: async (productData: any) => {
    logApi('productService.createProduct', productData);
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: any) => {
    logApi('productService.updateProduct', { id, productData });
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

// Cart services
export const cartService = {
  normalizeVariant: (value?: string) => value ?? '',

  resolveCartItemProductId: (item: any) =>
    item?.product?._id?.toString() ||
    item?.product?.toString() ||
    item?.id ||
    item?.productId ||
    '',

  findMatchingCartItem: (items: any[], productId: string, size?: string, color?: string) => {
    const normalizedSize = cartService.normalizeVariant(size);
    const normalizedColor = cartService.normalizeVariant(color);

    return items.find((item: any) => {
      const id = cartService.resolveCartItemProductId(item);
      return (
        id === productId &&
        cartService.normalizeVariant(item.size) === normalizedSize &&
        cartService.normalizeVariant(item.color) === normalizedColor
      );
    });
  },

  getCart: async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const response = await api.get('/cart');
        if (response.data && response.data.status === 'success') {
          if (response.data.data) {
            return {
              items: response.data.data.items || [],
              total: response.data.data.total || 0,
              itemCount: response.data.data.itemCount || 0
            };
          }
          return {
            items: response.data.items || [],
            total: response.data.total || 0,
            itemCount: response.data.itemCount || 0
          };
        }
        if (response.data && response.data.items) {
          return {
            items: response.data.items || [],
            total: response.data.total || 0,
            itemCount: response.data.itemCount || 0
          };
        }
        return { items: [], total: 0, itemCount: 0 };
      } catch (error) {
        console.error('Error fetching cart from backend:', error);
        return { items: [], total: 0, itemCount: 0 };
      }
    }
    return cartService.getLocalCart();
  },

  getLocalCart: () => {
    try {
      const cart = localStorage.getItem('cart');
      const parsedCart = cart ? JSON.parse(cart) : { items: [], total: 0, itemCount: 0 };
      return {
        items: parsedCart.items || [],
        total: parsedCart.total || 0,
        itemCount: parsedCart.itemCount || 0
      };
    } catch (error) {
      console.error('Error parsing localStorage cart:', error);
      return { items: [], total: 0, itemCount: 0 };
    }
  },

  addToCart: async (item: any) => {
    const token = localStorage.getItem('token');
    const productId = item.id || item.productId;
    const quantity = item.quantity || 1;
    const size = item.size;
    const color = item.color;

    if (token) {
      try {
        const response = await api.post('/cart/items', {
          productId,
          quantity,
          size,
          color
        });

        if (response.data.status === 'success') {
          return response.data.data;
        }
        throw new Error('Failed to add to cart');
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }
    }
    return cartService.addToLocalCart(item);
  },

  addToLocalCart: (item: any) => {
    const cart = cartService.getLocalCart();

    const productId = item.id || item.productId;
    const name = item.name || '';
    const price = item.price || 0;
    const quantity = item.quantity || 1;
    const size = item.size;
    const color = item.color;
    const image = item.image || '';

    const existingItemIndex = cart.items.findIndex((i: any) =>
      i.productId === productId &&
      i.size === size &&
      i.color === color
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, name, price, quantity, size, color, image });
    }

    cart.itemCount = cart.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    cart.total = cart.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  },

  updateQuantity: async (productId: string, size: string = '', color: string = '', quantity: number) => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const cart = await cartService.getCart();

        const item = cartService.findMatchingCartItem(cart.items || [], productId, size, color);

        if (item?._id) {
          const response = await api.put(`/cart/items/${item._id}`, { quantity });
          if (response.data.status === 'success') {
            return response.data.data;
          }
        }

        throw new Error('Cart item not found for update');
      } catch (error) {
        console.error('Error updating cart:', error);
        throw error;
      }
    }
    return cartService.updateLocalQuantity(productId, size, color, quantity);
  },

  updateLocalQuantity: (productId: string, size: string, color: string, quantity: number) => {
    const cart = cartService.getLocalCart();

    const itemIndex = cart.items.findIndex((item: any) =>
      item.productId === productId &&
      item.size === size &&
      item.color === color
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }

      cart.itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      cart.total = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      localStorage.setItem('cart', JSON.stringify(cart));
    }
    return cart;
  },

  removeFromCart: async (productId: string, size: string = '', color: string = '') => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const cart = await cartService.getCart();

        const item = cartService.findMatchingCartItem(cart.items || [], productId, size, color);

        if (item?._id) {
          const response = await api.delete(`/cart/items/${item._id}`);
          if (response.data.status === 'success') {
            return response.data.data;
          }
        }

        throw new Error('Cart item not found for removal');
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    }
    return cartService.removeFromLocalCart(productId, size, color);
  },

  removeFromLocalCart: (productId: string, size: string, color: string) => {
    const cart = cartService.getLocalCart();

    cart.items = cart.items.filter((item: any) =>
      !(item.productId === productId &&
        item.size === size &&
        item.color === color)
    );

    cart.itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    cart.total = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  },

  clearCart: async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const response = await api.delete('/cart');
        if (response.data.status === 'success') {
          return { items: [], total: 0, itemCount: 0 };
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
    localStorage.setItem('cart', JSON.stringify({ items: [], total: 0, itemCount: 0 }));
    return { items: [], total: 0, itemCount: 0 };
  },

  syncCartAfterLogin: async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const localCart = cartService.getLocalCart();

    if (localCart.items.length > 0) {
      try {
        for (const item of localCart.items) {
          const productId = item.productId || item.id;
          if (!productId) continue;

          await api.post('/cart/items', {
            productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color
          });
        }
        localStorage.setItem('cart', JSON.stringify({ items: [], total: 0, itemCount: 0 }));

        const response = await api.get('/cart');
        return response.data.data;
      } catch (error) {
        console.error('Error syncing cart:', error);
        throw error;
      }
    }
    return null;
  }
};

// Wishlist services
export const wishlistService = {
  getWishlist: async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      return { items: [] };
    }

    try {
      const response = await api.get('/wishlist');
      if (response.data.status === 'success') {
        return response.data.data || { items: [] };
      }
      return { items: [] };
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { items: [] };
    }
  },

  addToWishlist: async (productId: string) => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please login to add items to wishlist');
    }

    try {
      const response = await api.post('/wishlist/items', { productId });
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error('Failed to add to wishlist');
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  removeFromWishlist: async (productId: string) => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please login to remove items from wishlist');
    }

    try {
      const response = await api.delete(`/wishlist/items/${productId}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error('Failed to remove from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },

  clearWishlist: async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please login to clear wishlist');
    }

    try {
      const response = await api.delete('/wishlist');
      if (response.data.status === 'success') {
        return { items: [] };
      }
      throw new Error('Failed to clear wishlist');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }
  }
};

// Order services
export const orderService = {
  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  createRazorpayOrder: async (amount: number, receipt?: string) => {
    const response = await api.post('/orders/razorpay/create-order', {
      amount,
      currency: 'INR',
      receipt
    });
    return response.data;
  },

  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post('/orders/razorpay/verify', payload);
    return response.data;
  },

  getMyOrders: async (page = 1, limit = 10) => {
    const response = await api.get(`/orders/my-orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string, reason?: string) => {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  getAllOrders: async (params?: any) => {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  },

  updateOrderStatus: async (id: string, data: any) => {
    const response = await api.put(`/orders/admin/${id}/status`, data);
    return response.data;
  },

  processRefund: async (id: string, reason?: string) => {
    const response = await api.post(`/orders/admin/${id}/refund`, { reason });
    return response.data;
  },

  getOrderStats: async () => {
    const response = await api.get('/orders/admin/stats');
    return response.data;
  },

  getAdminAnalytics: async () => {
    const response = await api.get('/orders/admin/analytics');
    return response.data;
  }
};

// User services (Admin)
export const userService = {
  getAllUsers: async (params?: any) => {
    const response = await api.get('/users/admin/all', { params });
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/users/admin/stats');
    return response.data;
  },

  updateUserRole: async (id: string, role: 'customer' | 'admin') => {
    const response = await api.put(`/users/admin/${id}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.put(`/users/admin/${id}/status`, { isActive });
    return response.data;
  }
};

// Address services
export const addressService = {
  getAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  addAddress: async (addressData: any) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  updateAddress: async (id: string, addressData: any) => {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  deleteAddress: async (id: string) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },

  setDefaultAddress: async (id: string) => {
    const response = await api.put(`/addresses/${id}/default`);
    return response.data;
  }
};

// Profile services
export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/profile/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  uploadProfilePicture: async (imageUrl: string) => {
    const response = await api.post('/profile/profile-picture', { imageUrl });
    return response.data;
  }
};

export const supportService = {
  submitMessage: async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const response = await api.post('/support', payload);
    return response.data;
  },

  getAdminMessages: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/admin/support', { params });
    return response.data;
  },

  replyToMessage: async (id: string, message: string) => {
    const response = await api.put(`/admin/support/${id}/reply`, { message });
    return response.data;
  },

  getMyMessages: async () => {
    const response = await api.get('/support/my-messages');
    return response.data;
  },

  markReplyRead: async (id: string) => {
    const response = await api.put(`/support/${id}/read`);
    return response.data;
  }
};

// Upload services (Admin)
export const uploadService = {
  uploadImages: async (files: File[], metadata?: { category?: string }) => {
    logApi('uploadService.uploadImages', files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type
    })));
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (metadata?.category) {
      formData.append('category', metadata.category);
    }

    const response = await api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export const settingsService = {
  getPublicSettings: async () => {
    const response = await api.get('/settings/public');
    return response.data;
  },

  getAdminSettings: async () => {
    const response = await api.get('/settings/admin');
    return response.data;
  },

  updateAdminSettings: async (settingsData: any) => {
    const response = await api.put('/settings/admin', settingsData);
    return response.data;
  }
};

export default api;
