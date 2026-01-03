import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../lib/navigation';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_zone: string;
  delivery_city: string;
  created_at: string;
  validated_at: string | null;
}

const STATUS_CONFIG = {
  pending: { label: 'En attente validation', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  confirmed: { label: 'Confirmée', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  processing: { label: 'En préparation', icon: Package, color: 'text-blue-600 bg-blue-50' },
  shipped: { label: 'Expédiée', icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
  delivered: { label: 'Livrée', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Commandes</h1>
          <p className="text-gray-600">Suivez l'état de vos commandes en temps réel</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmées
            </button>
            <button
              onClick={() => setFilter('shipped')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'shipped'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En livraison
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'delivered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Livrées
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucune commande trouvée</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Parcourir les produits
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.order_number}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="text-gray-500">Date de commande</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">Livraison</p>
                          <p className="font-medium text-gray-900">
                            {order.delivery_zone === 'lyon' ? 'Lyon Métropole' : 'France'}
                            {order.delivery_city && ` - ${order.delivery_city}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500">Paiement</p>
                          <p className="font-medium text-gray-900">
                            {order.payment_status === 'paid' && 'Payé'}
                            {order.payment_status === 'pending' && 'En attente'}
                            {order.payment_status === 'credit_30' && 'Crédit 30j'}
                            {order.payment_status === 'credit_60' && 'Crédit 60j'}
                          </p>
                        </div>
                      </div>

                      {order.status === 'pending' && !order.validated_at && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            Votre commande est en attente de validation par MYGROS INTERNATIONAL
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {order.total_amount.toFixed(2)}€
                      </p>
                      <button className="mt-2 flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium text-sm">
                        <Eye className="w-4 h-4" />
                        <span>Détails</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
