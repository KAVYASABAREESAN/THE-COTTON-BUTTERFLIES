import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { orderService, productService } from '../../services/api';

interface MonthlySalesPoint {
  year: number;
  month: number;
  label: string;
  revenue: number;
  orders: number;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  topSellingProduct: {
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;
  } | null;
  monthlySales: MonthlySalesPoint[];
}

interface DashboardData {
  totalProducts: number;
  recentOrders: any[];
  lowStockProducts: any[];
}

const SalesLineChart: React.FC<{ data: MonthlySalesPoint[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-500">
        No sales data yet
      </div>
    );
  }

  const width = 640;
  const height = 260;
  const leftPad = 42;
  const rightPad = 18;
  const topPad = 20;
  const bottomPad = 34;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const points = data
    .map((point, index) => {
      const x = leftPad + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y = topPad + ((maxRevenue - point.revenue) / maxRevenue) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[620px]">
        {[0, 1, 2, 3, 4].map((n) => {
          const y = topPad + (n / 4) * chartHeight;
          return (
            <line
              key={n}
              x1={leftPad}
              y1={y}
              x2={width - rightPad}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        <polyline
          fill="none"
          stroke="#EC4899"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {data.map((point, index) => {
          const x = leftPad + (index / Math.max(data.length - 1, 1)) * chartWidth;
          const y = topPad + ((maxRevenue - point.revenue) / maxRevenue) * chartHeight;
          return (
            <g key={`${point.year}-${point.month}`}>
              <circle cx={x} cy={y} r="4" fill="#DB2777" />
              <text x={x} y={height - 12} textAnchor="middle" fontSize="11" fill="#6B7280">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData>({
    totalProducts: 0,
    recentOrders: [],
    lowStockProducts: []
  });
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    totalRevenue: 0,
    newUsersThisMonth: 0,
    topSellingProduct: null,
    monthlySales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [productsRes, recentOrdersRes, analyticsRes] = await Promise.all([
        productService.getAllProducts({ limit: 100 }),
        orderService.getAllOrders({ page: 1, limit: 5 }),
        orderService.getAdminAnalytics()
      ]);

      const products = productsRes.data || [];
      setDashboard({
        totalProducts: productsRes.total || 0,
        recentOrders: recentOrdersRes?.data || [],
        lowStockProducts: products.filter((p: any) => p.stock < 10).slice(0, 5)
      });

      setAnalytics({
        totalOrders: analyticsRes?.data?.totalOrders || 0,
        totalRevenue: analyticsRes?.data?.totalRevenue || 0,
        newUsersThisMonth: analyticsRes?.data?.newUsersThisMonth || 0,
        topSellingProduct: analyticsRes?.data?.topSellingProduct || null,
        monthlySales: analyticsRes?.data?.monthlySales || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle ? <p className="text-xs text-gray-500 mt-2">{subtitle}</p> : null}
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const topProductValue = analytics.topSellingProduct?.name || 'No sales yet';
  const topProductSubtitle = analytics.topSellingProduct
    ? `${analytics.topSellingProduct.quantitySold} units sold`
    : '';

  return (
    <div>
      <h1 className="text-3xl font-serif font-light text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Orders"
          value={analytics.totalOrders}
          icon={ShoppingBag}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Total Revenue"
          value={`INR ${analytics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <StatCard
          title="Top Selling Product"
          value={topProductValue}
          subtitle={topProductSubtitle}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="New Users This Month"
          value={analytics.newUsersThisMonth}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Monthly Sales</h2>
          <span className="text-sm text-gray-500">Last 6 months</span>
        </div>
        <SalesLineChart data={analytics.monthlySales} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/admin/products/add"
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <Package size={32} className="mb-3" />
          <h3 className="text-lg font-medium mb-1">Add New Product</h3>
          <p className="text-sm text-pink-100">Create a new product listing</p>
        </Link>

        <Link
          to="/admin/orders"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <ShoppingBag size={32} className="mb-3" />
          <h3 className="text-lg font-medium mb-1">View Orders</h3>
          <p className="text-sm text-purple-100">Manage customer orders</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <Users size={32} className="mb-3" />
          <h3 className="text-lg font-medium mb-1">Manage Users</h3>
          <p className="text-sm text-blue-100">View and manage user accounts</p>
        </Link>
      </div>

      {dashboard.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-orange-500" size={24} />
            <h2 className="text-lg font-medium text-gray-900">Low Stock Alert</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Stock</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Price</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.lowStockProducts.map((product: any) => (
                  <tr key={product._id} className="border-b">
                    <td className="py-3 text-sm text-gray-900">{product.name}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {product.stock} left
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-900">INR {product.price}</td>
                    <td className="py-3">
                      <Link
                        to={`/admin/products/edit/${product._id}`}
                        className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                      >
                        Update Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
        {dashboard.recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet. Come back later!</p>
        ) : (
          <div className="space-y-3">
            {dashboard.recentOrders.map((order: any) => (
              <div key={order._id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium text-gray-900">{order.orderId}</p>
                  <p className="text-sm text-gray-500">{order.user?.name || 'Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">INR {Number(order.total || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 capitalize">{order.orderStatus}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4">Total products in catalog: {dashboard.totalProducts}</p>
    </div>
  );
};

export default AdminDashboard;
