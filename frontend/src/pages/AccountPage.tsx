import React, { useEffect, useState } from 'react';
import { User, Package, Heart, MapPin, LogOut, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { supportService } from '../services/api';
import ProfilePage from './ProfilePage';
import MyOrdersPage from './MyOrdersPage';
import WishlistPage from './WishlistPage';
import AddressesPage from './AddressesPage';
import SupportInbox from '../components/support/SupportInbox';

const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [unreadSupportReplies, setUnreadSupportReplies] = useState(0);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'support', label: 'Support Replies', icon: Bell, badge: unreadSupportReplies },
  ];

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    const validTabs = new Set(['profile', 'orders', 'wishlist', 'addresses', 'support']);
    if (tab && validTabs.has(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchUnreadSupportReplies = async () => {
      try {
        const response = await supportService.getMyMessages();
        if (response.status === 'success') {
          setUnreadSupportReplies(response.unreadReplies || 0);
        }
      } catch (error) {
        setUnreadSupportReplies(0);
      }
    };

    fetchUnreadSupportReplies();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-300 to-blue-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="font-medium text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-pink-50 text-pink-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="flex items-center gap-2">
                        {tab.label}
                        {tab.badge ? (
                          <span className="rounded-full bg-pink-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {tab.badge}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && <ProfilePage />}
            {activeTab === 'orders' && <MyOrdersPage />}
            {activeTab === 'wishlist' && <WishlistPage />}
            {activeTab === 'addresses' && <AddressesPage />}
            {activeTab === 'support' && (
              <SupportInbox onUnreadCountChange={setUnreadSupportReplies} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
