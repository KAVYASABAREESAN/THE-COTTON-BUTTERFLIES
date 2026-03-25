import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
  category: string;
  stock?: number;
  _id?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<{ items: any[]; total: number; itemCount: number }>) => {
      console.log('Setting cart in Redux:', action.payload);
      // Transform items to match CartItem interface
      state.items = action.payload.items.map((item: any) => ({
        id: item.product?._id || item.productId || item.id,
        name: item.name || item.product?.name || '',
        price: item.price || 0,
        quantity: item.quantity || 1,
        size: item.size,
        color: item.color,
        image: item.image || item.product?.images?.[0] || '',
        category: item.category || item.product?.category || 'women',
        _id: item._id
      }));
      state.total = action.payload.total || 0;
      state.itemCount = action.payload.itemCount || 0;
      state.loading = false;
      state.error = null;
    },
    
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        item => item.id === action.payload.id && 
        item.size === action.payload.size && 
        item.color === action.payload.color
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      console.log('Cart after add:', { items: state.items, total: state.total, itemCount: state.itemCount });
    },
    
    removeFromCart: (state, action: PayloadAction<{ id: string; size?: string; color?: string }>) => {
      state.items = state.items.filter(
        item => !(item.id === action.payload.id && 
        item.size === action.payload.size && 
        item.color === action.payload.color)
      );

      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    updateQuantity: (state, action: PayloadAction<{ id: string; size?: string; color?: string; quantity: number }>) => {
      const item = state.items.find(
        item => item.id === action.payload.id && 
        item.size === action.payload.size && 
        item.color === action.payload.color
      );

      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(
            i => !(i.id === action.payload.id && 
              i.size === action.payload.size && 
              i.color === action.payload.color)
          );
        } else {
          item.quantity = action.payload.quantity;
        }
      }

      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    }
  },
});

export const { 
  setCart, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  setLoading,
  setError 
} = cartSlice.actions;
export default cartSlice.reducer;