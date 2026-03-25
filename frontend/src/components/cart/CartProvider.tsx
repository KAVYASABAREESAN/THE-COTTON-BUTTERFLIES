import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { useCartSync } from '../../hooks/useCartSync';

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  useCartSync();
  const { loading } = useAppSelector((state) => state.cart);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};
