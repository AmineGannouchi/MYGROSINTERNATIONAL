import { useState, useEffect } from 'react';
import { Package, ShoppingBag, Clock, CheckCircle, Euro, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .eq('buyer_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (orders) {
        const totalSpent = orders.reduce((sum, order) => {
          return order.status !== 'cancelled' ? sum + Number(order.total_amount) : sum;
        }, 0);

        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const deliveredCount = orders.filter(o => o.status === 'delivered').length;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pendingCount,
          deliveredOrders: deliveredCount,
          totalSpent,
          recentOrders: orders.slice(0, 5),
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Confirmé', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      preparing: { label: 'En préparation', className: 'bg-amber-100 text-amber-800', icon: Package },
      out_for_delivery: { label: 'En livraison', className: 'bg-purple-100 text-purple-800', icon: Package },
      delivered: { label: 'Livré', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800', icon: Clock },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Bienvenue dans votre espace client</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Total commandes</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">En attente</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Livrées</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveredOrders}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Euro className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Total dépensé</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSpent.toFixed(2)}€</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => navigate('/client/catalogue')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Catalogue produits</h3>
                <p className="text-gray-600">Parcourez nos produits méditerranéens</p>
              </button>

              <button
                onClick={() => navigate('/client/orders')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
                  <ShoppingBag className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mes commandes</h3>
                <p className="text-gray-600">Suivez l'état de vos commandes</p>
              </button>

              <button
                onClick={() => navigate('/client/promo')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Promotions</h3>
                <p className="text-gray-600">Découvrez nos offres spéciales</p>
              </button>
            </div>

            {stats.recentOrders.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Commandes récentes</h2>
                  <button
                    onClick={() => navigate('/client/orders')}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Voir toutes
                  </button>
                </div>

                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/client/orders/${order.id}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{order.order_number}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {order.total_amount.toFixed(2)}€
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(order.status)}
                        <span className="text-sm text-green-600 hover:text-green-700 font-medium">
                          Voir détails →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.recentOrders.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune commande</h3>
                <p className="text-gray-600 mb-6">Commencez par parcourir notre catalogue</p>
                <button
                  onClick={() => navigate('/client/catalogue')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Voir le catalogue
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
