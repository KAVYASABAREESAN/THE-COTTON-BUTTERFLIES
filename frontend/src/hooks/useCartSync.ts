import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCart, setLoading } from '../store/slices/cartSlice';
import { cartService } from '../services/api';

export const useCartSync = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const initialLoadDone = useRef(false);

  const loadCart = useCallback(async (force = false) => {
    console.log('Loading cart... Auth state:', isAuthenticated);
    dispatch(setLoading(true));
    
    try {
      if (isAuthenticated) {
        console.log('Fetching cart from backend for user:', user?.id);
        
        // Only sync on initial load or when forced
        if (!initialLoadDone.current || force) {
          await cartService.syncCartAfterLogin();
        }
        
        const cartData = await cartService.getCart();
        console.log('Backend cart response:', cartData);
        
        if (cartData && cartData.items) {
          dispatch(setCart({
            items: cartData.items || [],
            total: cartData.total || 0,
            itemCount: cartData.itemCount || 0
          }));
        } else {
          dispatch(setCart({ items: [], total: 0, itemCount: 0 }));
        }
        
        initialLoadDone.current = true;
      } else {
        console.log('Fetching cart from localStorage');
        const localCart = cartService.getLocalCart();
        console.log('Local cart:', localCart);
        
        dispatch(setCart({
          items: localCart.items || [],
          total: localCart.total || 0,
          itemCount: localCart.itemCount || 0
        }));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch(setCart({ items: [], total: 0, itemCount: 0 }));
    } finally {
      dispatch(setLoading(false));
    }
  }, [isAuthenticated, user?.id, dispatch]);

  // Load cart on mount and when auth changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return { reloadCart: () => loadCart(true) };
};