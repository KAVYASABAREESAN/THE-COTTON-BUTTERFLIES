import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Lock, Camera } from 'lucide-react';
import { profileService } from '../services/api';

interface Profile {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Profile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    dateOfBirth: '',
    gender: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      await profileService.updateProfile(formData);
      setProfile(formData);
      setEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      await profileService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-3xl">
        <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">
          My Profile
        </h1>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-8 text-white">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-pink-500">
                  {profile?.name?.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg text-pink-500 hover:text-pink-600">
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-serif">{profile?.name}</h2>
                <p className="text-pink-100">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {!editing ? (
              // View Mode
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                      <User size={16} className="text-gray-400" />
                      {profile?.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                      <Mail size={16} className="text-gray-400" />
                      {profile?.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                      <Phone size={16} className="text-gray-400" />
                      {profile?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Date of Birth</label>
                    <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                      <Calendar size={16} className="text-gray-400" />
                      {profile?.dateOfBirth 
                        ? new Date(profile.dateOfBirth).toLocaleDateString()
                        : 'Not provided'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Bio</label>
                    <p className="text-gray-700 mt-1">
                      {profile?.bio || 'No bio provided'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Lock size={18} />
                    Change Password
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Change Password Form */}
            {showPasswordForm && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => setShowPasswordForm(false)}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;