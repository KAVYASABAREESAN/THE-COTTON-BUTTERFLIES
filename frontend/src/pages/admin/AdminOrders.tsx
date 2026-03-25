import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { orderService } from '../../services/api';

interface Order {
  _id: string;
  orderId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    product: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  statusHistory: Array<{
    status: string;
    note?: string;
    timestamp: string;
  }>;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>({});
  const [statusNote, setStatusNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [currentPage, filter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10
      };
      
      if (filter !== 'all') params.status = filter;
      if (searchTerm) params.search = searchTerm;

      const response = await orderService.getAllOrders(params);
      if (response.status === 'success') {
        setOrders(response.data);
        setTotalPages(response.pages);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await orderService.getOrderStats();
      if (response.status === 'success') {
        setStats(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, {
        status: selectedOrder?.orderStatus || '',
        note: statusNote,
        trackingNumber,
        trackingUrl
      });
      
      setSelectedOrder(null);
      setStatusNote('');
      setTrackingNumber('');
      setTrackingUrl('');
      fetchOrders();
      fetchStats();
      alert('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    }
  };

  const handleRefund = async (orderId: string) => {
    if (window.confirm('Are you sure you want to refund this order?')) {
      try {
        await orderService.processRefund(orderId, statusNote);
        setSelectedOrder(null);
        fetchOrders();
        fetchStats();
        alert('Refund processed successfully');
      } catch (error) {
        console.error('Error processing refund:', error);
        alert('Failed to process refund');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'confirmed': return <CheckCircle size={16} className="text-blue-500" />;
      case 'processing': return <Package size={16} className="text-purple-500" />;
      case 'shipped': return <Truck size={16} className="text-indigo-500" />;
      case 'out_for_delivery': return <Truck size={16} className="text-orange-500" />;
      case 'delivered': return <CheckCircle size={16} className="text-green-500" />;
      case 'cancelled': return <XCircle size={16} className="text-red-500" />;
      case 'refunded': return <RefreshCw size={16} className="text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'shipped': return 'bg-indigo-100 text-indigo-700';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const statusOptions = [
    'pending', 'confirmed', 'processing', 
    'shipped', 'out_for_delivery', 'delivered', 
    'cancelled', 'refunded'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">
        Manage Orders
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Processing</p>
          <p className="text-2xl font-bold text-purple-600">{stats.processingOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Shipped</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.shippedOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Delivered</p>
          <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Order ID or Phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setFilter('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                filter === 'all' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {statusOptions.map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filter === status 
                    ? getStatusColor(status) 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusText(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.orderId}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-gray-900">{order.user?.name}</div>
                      <div className="text-sm text-gray-500">{order.user?.email}</div>
                      <div className="text-sm text-gray-500">{order.user?.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₹{order.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                      {getStatusText(order.orderStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-700'
                        : order.paymentStatus === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif font-medium">
                  Order Details - {selectedOrder.orderId}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                  <p className="text-gray-600">
                    <span className="font-medium">Name:</span> {selectedOrder.user?.name}<br />
                    <span className="font-medium">Email:</span> {selectedOrder.user?.email}<br />
                    <span className="font-medium">Phone:</span> {selectedOrder.user?.phone}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                  <p className="text-gray-600">
                    {selectedOrder.shippingAddress?.street}<br />
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zip}<br />
                    {selectedOrder.shippingAddress?.country}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-4 border-b pb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-blue-100 rounded-lg flex-shrink-0">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          {item.color && <span>Color: {item.color} | </span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₹{selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">₹{selectedOrder.shippingCost?.toLocaleString() || '0'}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-lg">₹{selectedOrder.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="text-gray-900 capitalize">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium ${
                      selectedOrder.paymentStatus === 'paid' 
                        ? 'text-green-600'
                        : selectedOrder.paymentStatus === 'failed'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-4">Update Order Status</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) => setSelectedOrder({
                        ...selectedOrder,
                        orderStatus: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {getStatusText(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note (optional)
                    </label>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Add a note about this status update..."
                    />
                  </div>

                  {selectedOrder.orderStatus === 'shipped' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="Enter tracking number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tracking URL
                        </label>
                        <input
                          type="url"
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="https://tracking-url.com"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder._id)}
                      className="flex-1 bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      Update Status
                    </button>
                    
                    {selectedOrder.paymentStatus === 'paid' && selectedOrder.orderStatus !== 'refunded' && (
                      <button
                        onClick={() => handleRefund(selectedOrder._id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Process Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;