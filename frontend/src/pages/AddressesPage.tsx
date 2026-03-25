import React, { useState, useEffect } from 'react';
import { Home, Briefcase, MapPin, Plus, Edit, Trash2, Check } from 'lucide-react';
import { addressService } from '../services/api';
import AddressForm from '../components/address/AddressForm';

interface Address {
  _id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressService.getAddresses();
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (data: any) => {
    try {
      await addressService.addAddress(data);
      setShowForm(false);
      fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    }
  };

  const handleUpdateAddress = async (data: any) => {
    if (!editingAddress) return;
    try {
      await addressService.updateAddress(editingAddress._id, data);
      setEditingAddress(null);
      fetchAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await addressService.deleteAddress(id);
        fetchAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address');
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'home': return <Home size={20} className="text-blue-500" />;
      case 'work': return <Briefcase size={20} className="text-purple-500" />;
      default: return <MapPin size={20} className="text-gray-500" />;
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
      <div className="container-custom max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-light text-gray-900">
            My Addresses
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
          >
            <Plus size={20} />
            Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              No addresses saved
            </h2>
            <p className="text-gray-500 mb-6">
              Add your first address to make checkout faster
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600"
            >
              <Plus size={20} />
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                  address.isDefault ? 'border-pink-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(address.type)}
                    <span className="capitalize font-medium text-gray-700">
                      {address.type}
                    </span>
                    {address.isDefault && (
                      <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check size={12} />
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingAddress(address)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-gray-600">
                  <p className="font-medium text-gray-900">{address.name}</p>
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.state} - {address.zip}
                  </p>
                  <p>{address.country}</p>
                  <p className="text-gray-500">Phone: {address.phone}</p>
                </div>

                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="mt-4 text-sm text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Address Form Modal */}
        {(showForm || editingAddress) && (
          <AddressForm
            initialData={editingAddress || undefined}
            onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress}
            onClose={() => {
              setShowForm(false);
              setEditingAddress(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AddressesPage;