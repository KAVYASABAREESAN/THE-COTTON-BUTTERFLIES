import React, { useState } from 'react';
import { Heart, User, Search, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CartIcon from '../cart/CartIcon';
import { usePublicSettings } from '../../context/PublicSettingsContext';

const LOCAL_COMPANY_LOGO_URL = `${process.env.PUBLIC_URL}/company-logo.jpeg`;
const HEADER_BRAND_NAME = 'The Cotton Butterflies';

const Header: React.FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { settings, resolveAssetUrl } = usePublicSettings();
  const navigate = useNavigate();

  const headerLogo = resolveAssetUrl(settings.general.logoUrl) || LOCAL_COMPANY_LOGO_URL;
  const storeName = HEADER_BRAND_NAME;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="container-custom">
        <div className="relative flex items-center gap-4 py-4">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center space-x-2 md:flex-[0_1_24rem]">
            <img
              src={headerLogo}
              alt="The Cotton Butterflies logo"
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
            />
            <h1
              className="hidden truncate text-2xl font-serif font-bold text-gray-800 md:block"
              title={storeName}
            >
              {storeName}
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center justify-center space-x-8 md:flex">
            <Link to="/new-arrivals" className="nav-link font-medium">New Arrivals</Link>
            <Link to="/women" className="nav-link font-medium">Women</Link>
            <Link to="/kids" className="nav-link font-medium">Kids</Link>
            <Link to="/accessories" className="nav-link font-medium">Accessories</Link>
            <Link to="/shop" className="nav-link font-medium">Collections</Link>
            <Link to="/virtual-tour" className="nav-link font-medium">Virtual Tour</Link>
          </nav>

          {/* Icons */}
          <div className="ml-auto flex shrink-0 items-center space-x-4 md:space-x-6">
            {/* Search */}
            <div className="relative flex items-center">
              {showSearch ? (
                <div className="absolute right-0 top-12 w-[19rem] md:w-[22rem] bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50">
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="flex-1 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-pink-500 text-white p-2.5 rounded-lg hover:bg-pink-600 transition-colors"
                      aria-label="Submit search"
                    >
                      <Search size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSearch(false)}
                      className="text-gray-500 hover:text-gray-700 p-2"
                      aria-label="Close search"
                    >
                      <X size={16} />
                    </button>
                  </form>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            <Link to="/account" className="text-gray-600 hover:text-gray-900 p-2">
              <User size={20} />
            </Link>
            <Link to="/wishlist" className="text-gray-600 hover:text-gray-900 p-2">
              <Heart size={20} />
            </Link>
            <CartIcon />
            <button className="md:hidden text-gray-600 p-2">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
