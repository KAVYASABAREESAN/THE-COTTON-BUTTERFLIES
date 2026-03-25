import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

const CartIcon: React.FC = () => {
  const { itemCount } = useAppSelector((state) => state.cart);

  return (
    <Link to="/cart" className="relative text-gray-600 hover:text-gray-900">
      <ShoppingBag size={20} />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;