import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';

import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import AdminRoute from './components/admin/AdminRoute';
import CustomerRoute from './components/auth/CustomerRoute';
import { CartProvider } from './components/cart/CartProvider';
import { ProductProvider } from './context/ProductContext';
import { PublicSettingsProvider } from './context/PublicSettingsContext';

// Public Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import WomenPage from './pages/WomenPage';
import KidsPage from './pages/KidsPage';
import AccessoriesPage from './pages/AccessoriesPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import NotFoundPage from './pages/NotFoundPage';
import MyOrdersPage from './pages/MyOrdersPage';
import CheckoutPage from './pages/CheckoutPage';
import JewelryTryOnPage from './pages/JewelryTryOnPage';
import VirtualTourPage from './pages/VirtualTourPage';
import ContactSupportPage from './pages/ContactSupportPage';

// Admin Pages
import {
  AdminLogin,
  AdminDashboard,
  AdminProducts,
  AdminAddProduct,
  AdminOrders,
  AdminUsers,
  AdminSupportMessages,
  AdminSettings
} from './pages/admin';

function App() {
  return (
    <Provider store={store}>
      <ProductProvider>
        <CartProvider>
          <PublicSettingsProvider>
            <Router>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    background: '#1f2937',
                    color: '#fff',
                    borderRadius: '14px'
                  },
                  success: {
                    style: {
                      background: '#065f46'
                    }
                  },
                  error: {
                    style: {
                      background: '#991b1b'
                    }
                  }
                }}
              />
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="product/:id" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route
                  path="wishlist"
                  element={
                    <CustomerRoute allowAdmin>
                      <WishlistPage />
                    </CustomerRoute>
                  }
                />
                <Route
                  path="account"
                  element={
                    <CustomerRoute allowAdmin>
                      <AccountPage />
                    </CustomerRoute>
                  }
                />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="collections" element={<ShopPage />} />
                <Route path="women" element={<WomenPage />} />
                <Route path="accessories" element={<AccessoriesPage />} />
                <Route
                  path="my-orders"
                  element={
                    <CustomerRoute>
                      <MyOrdersPage />
                    </CustomerRoute>
                  }
                />
                <Route path="kids" element={<KidsPage />} />
                <Route path="new-arrivals" element={<NewArrivalsPage />} />
                <Route path="try-on" element={<JewelryTryOnPage />} />
                <Route path="virtual-tour" element={<VirtualTourPage />} />
                <Route path="contact-support" element={<ContactSupportPage />} />
                <Route
                  path="checkout"
                  element={<CheckoutPage />}
                />
              </Route>

              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/add" element={<AdminAddProduct />} />
                {/* Edit route - passes product id to AdminAddProduct */}
                <Route path="products/edit/:id" element={<AdminAddProduct />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="support" element={<AdminSupportMessages />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </PublicSettingsProvider>
        </CartProvider>
      </ProductProvider>
    </Provider>
  );
}

export default App;
