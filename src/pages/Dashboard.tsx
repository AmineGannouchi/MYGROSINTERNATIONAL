import { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, TrendingUp, MapPin, Euro, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../lib/navigation';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  pendingOrdersList: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    created_at: string;
    buyer: {
      name: string;
    };
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
  }>;
  recentVisits: Array<{
    id: string;
    client_name: string;
    client_city: string;
    visit_date: string;
    commercial: {
      first_name: string;
      last_name: string;
    };
  }>;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    pendingOrdersList: [],
    revenueByCategory: [],
    recentVisits: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status');

      const { data: pendingOrders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          created_at,
          buyer:companies!orders_buyer_id_fkey (name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('available', true);

      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('company_type', 'buyer');

      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          subtotal,
          product:products (
            category:categories (name)
          )
        `);

      const { data: visits } = await supabase
        .from('visit_reports')
        .select(`
          id,
          client_name,
          client_city,
          visit_date,
          commercial:profiles!visit_reports_commercial_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('visit_date', { ascending: false })
        .limit(5);

      const totalRevenue = orders?.reduce((sum, order) => {
        return order.status !== 'cancelled' ? sum + Number(order.total_amount) : sum;
      }, 0) || 0;

      const categoryRevenue = new Map<string, number>();
      orderItems?.forEach((item) => {
        const categoryName = item.product?.category?.name || 'Autre';
        const current = categoryRevenue.get(categoryName) || 0;
        categoryRevenue.set(categoryName, current + Number(item.subtotal));
      });

      const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalProducts: products?.length || 0,
        totalCustomers: companies?.length || 0,
        pendingOrders: pendingCount,
        pendingOrdersList: pendingOrders || [],
        revenueByCategory: Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({
          category,
          revenue,
        })),
        recentVisits: visits || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Accès réservé aux administrateurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrateur</h1>
          <p className="text-gray-600">Vue d'ensemble de MYGROS INTERNATIONAL</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Euro className="w-6 h-6 text-green-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Chiffre d'affaires</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRevenue.toFixed(2)}€
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Commandes totales</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>

              <div
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => navigate('/dashboard/admin/orders')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  {stats.pendingOrders > 0 && (
                    <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                  )}
                </div>
                <h3 className="text-gray-600 text-sm mb-1">En attente validation</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Produits disponibles</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-teal-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Clients B2B</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>

            {stats.pendingOrdersList.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-amber-600" />
                    Commandes en attente de validation
                  </h2>
                  <button
                    onClick={() => navigate('/dashboard/admin/orders')}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Voir toutes
                  </button>
                </div>

                <div className="space-y-3">
                  {stats.pendingOrdersList.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate('/dashboard/admin/orders')}
                      className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{order.order_number}</p>
                          <p className="text-sm text-gray-600">{order.buyer?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.created_at).toLocaleDateString('fr-FR')} à{' '}
                            {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {order.total_amount.toFixed(2)}€
                          </p>
                          <button className="text-xs text-green-600 hover:text-green-700 font-medium mt-1">
                            Valider →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Chiffre d'affaires par catégorie
                </h2>
                {stats.revenueByCategory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                ) : (
                  <div className="space-y-4">
                    {stats.revenueByCategory.map((item) => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{item.category}</span>
                          <span className="text-sm font-bold text-green-600">
                            {item.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(item.revenue / stats.totalRevenue) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Dernières visites commerciales
                </h2>
                {stats.recentVisits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune visite enregistrée</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentVisits.map((visit) => (
                      <div key={visit.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{visit.client_name}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{visit.client_city}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(visit.visit_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Par {visit.commercial.first_name} {visit.commercial.last_name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-md p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">MYGROS INTERNATIONAL</h2>
              <p className="text-green-100">
                Grossiste spécialiste des saveurs méditerranéennes - Lyon/Corbas
              </p>
              <div className="mt-6 flex items-center justify-center space-x-8">
                <div>
                  <p className="text-3xl font-bold">2</p>
                  <p className="text-sm text-green-100">Catégories</p>
                </div>
                <div className="h-12 w-px bg-green-400"></div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalProducts}</p>
                  <p className="text-sm text-green-100">Produits</p>
                </div>
                <div className="h-12 w-px bg-green-400"></div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                  <p className="text-sm text-green-100">Clients B2B</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
