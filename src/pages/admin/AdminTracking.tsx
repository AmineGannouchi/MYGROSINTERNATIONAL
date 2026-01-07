import { useState, useEffect } from 'react';
import { Truck, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DeliveryMap from '../../components/maps/DeliveryMap';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_address: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  delivery_tracking: Array<{
    id: string;
    status: string;
    driver_id: string | null;
    eta_minutes: number | null;
    distance_km: number | null;
  }>;
}

interface Driver {
  user_id: string;
  first_name: string;
  last_name: string;
}

export default function AdminTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersResult, driversResult] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            profiles:buyer_user_id (first_name, last_name),
            delivery_tracking (*)
          `)
          .not('delivery_latitude', 'is', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .eq('role', 'driver'),
      ]);

      if (ordersResult.data) setOrders(ordersResult.data as any);
      if (driversResult.data) setDrivers(driversResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order || !order.delivery_tracking[0]) return;

      await supabase
        .from('delivery_tracking')
        .update({ driver_id: driverId })
        .eq('id', order.delivery_tracking[0].id);

      loadData();
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  const updateDeliveryStatus = async (trackingId: string, status: string) => {
    try {
      await supabase
        .from('delivery_tracking')
        .update({ status })
        .eq('id', trackingId);

      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Suivi des livraisons</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {orders.map((order) => {
              const tracking = order.delivery_tracking[0];
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-green-600' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Commande #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.profiles.first_name} {order.profiles.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {order.total_amount.toFixed(2)}€
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chauffeur
                      </label>
                      <select
                        value={tracking?.driver_id || ''}
                        onChange={(e) => assignDriver(order.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Non assigné</option>
                        {drivers.map((driver) => (
                          <option key={driver.user_id} value={driver.user_id}>
                            {driver.first_name} {driver.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut livraison
                      </label>
                      <select
                        value={tracking?.status || 'pending'}
                        onChange={(e) => updateDeliveryStatus(tracking.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="preparing">En préparation</option>
                        <option value="out_for_delivery">En livraison</option>
                        <option value="delivered">Livré</option>
                      </select>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{order.delivery_address}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                Aucune commande avec coordonnées
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            {selectedOrder && selectedOrder.delivery_latitude && selectedOrder.delivery_longitude ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Commande #{selectedOrder.id.slice(0, 8)}
                </h2>
                <DeliveryMap
                  destinationLat={selectedOrder.delivery_latitude}
                  destinationLng={selectedOrder.delivery_longitude}
                  showRoute={true}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Sélectionnez une commande pour voir la carte</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
