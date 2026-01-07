import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DeliveryStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  completedToday: number;
  inProgressDeliveries: number;
  activeDeliveries: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    delivery_address: string;
    delivery_city: string;
    delivery_latitude: number | null;
    delivery_longitude: number | null;
    profiles: {
      first_name: string;
      last_name: string;
      phone: string | null;
    };
    delivery_tracking: Array<{
      id: string;
      status: string;
    }>;
  }>;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedToday: 0,
    inProgressDeliveries: 0,
    activeDeliveries: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data: trackings } = await supabase
        .from('delivery_tracking')
        .select('id, order_id, status, updated_at')
        .eq('driver_id', user?.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedToday = trackings?.filter(t => {
        if (t.status !== 'delivered') return false;
        const updatedDate = new Date(t.updated_at);
        return updatedDate >= today;
      }).length || 0;

      const pendingCount = trackings?.filter(t =>
        t.status === 'pending' || t.status === 'confirmed' || t.status === 'preparing'
      ).length || 0;

      const inProgressCount = trackings?.filter(t => t.status === 'out_for_delivery').length || 0;

      const activeOrderIds = trackings
        ?.filter(t => t.status !== 'delivered' && t.status !== 'cancelled')
        .map(t => t.order_id) || [];

      let activeDeliveries = [];
      if (activeOrderIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total_amount,
            delivery_address,
            delivery_city,
            delivery_latitude,
            delivery_longitude,
            profiles:buyer_user_id (first_name, last_name, phone),
            delivery_tracking (id, status)
          `)
          .in('id', activeOrderIds)
          .order('created_at', { ascending: false });

        activeDeliveries = orders || [];
      }

      setStats({
        totalDeliveries: trackings?.length || 0,
        pendingDeliveries: pendingCount,
        completedToday,
        inProgressDeliveries: inProgressCount,
        activeDeliveries,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-gray-100 text-gray-800' },
      confirmed: { label: 'Confirmé', className: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'En préparation', className: 'bg-amber-100 text-amber-800' },
      out_for_delivery: { label: 'En livraison', className: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Livré', className: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord chauffeur</h1>
          <p className="text-gray-600">Gérez vos livraisons et itinéraires</p>
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
                    <Truck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Total livraisons</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">En attente</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Navigation className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">En cours</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressDeliveries}</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">Livrées aujourd'hui</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => navigate('/driver/deliveries')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Toutes mes livraisons</h3>
                <p className="text-gray-600">Voir l'historique complet</p>
              </button>

              <button
                onClick={() => navigate('/driver/messages')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
              >
                <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Messages</h3>
                <p className="text-gray-600">Communiquez avec l'équipe</p>
              </button>
            </div>

            {stats.activeDeliveries.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-green-600" />
                    Livraisons actives
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.activeDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      onClick={() => navigate(`/driver/deliveries/${delivery.id}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{delivery.order_number}</p>
                          <p className="text-sm text-gray-600">
                            {delivery.profiles.first_name} {delivery.profiles.last_name}
                          </p>
                          {delivery.profiles.phone && (
                            <p className="text-sm text-gray-500">{delivery.profiles.phone}</p>
                          )}
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {delivery.total_amount.toFixed(2)}€
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{delivery.delivery_address}</p>
                          <p>{delivery.delivery_city}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        {getStatusBadge(delivery.delivery_tracking[0]?.status || 'pending')}
                        <span className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                          Voir détails
                          <Navigation className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.activeDeliveries.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune livraison active</h3>
                <p className="text-gray-600">Les nouvelles livraisons apparaîtront ici</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
