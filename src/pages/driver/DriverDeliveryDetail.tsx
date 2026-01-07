import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package, User, Phone, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DeliveryMap from '../../components/maps/DeliveryMap';

interface Order {
  id: string;
  total_amount: number;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
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
    notes: string | null;
  }>;
}

export default function DriverDeliveryDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:buyer_user_id (first_name, last_name, phone),
          delivery_tracking (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (data) setOrder(data as any);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!order || !order.delivery_tracking[0]) return;

    setUpdating(true);
    try {
      await supabase
        .from('delivery_tracking')
        .update({ status })
        .eq('id', order.delivery_tracking[0].id);

      loadOrder();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Commande introuvable</p>
      </div>
    );
  }

  const tracking = order.delivery_tracking[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Détail de livraison #{order.id.slice(0, 8)}
        </h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Informations client
            </h2>
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">
                {order.profiles.first_name} {order.profiles.last_name}
              </p>
              {order.profiles.phone && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {order.profiles.phone}
                </p>
              )}
              <p className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>
                  {order.delivery_address}
                  <br />
                  {order.delivery_postal_code} {order.delivery_city}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Statut de livraison</h2>
            <div className="space-y-3">
              <select
                value={tracking?.status || 'pending'}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updating}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="preparing">En préparation</option>
                <option value="out_for_delivery">En livraison</option>
                <option value="delivered">Livré</option>
              </select>

              <div className="pt-3 border-t">
                <p className="text-2xl font-bold text-green-600">
                  {order.total_amount.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>

          {order.delivery_latitude && order.delivery_longitude && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Itinéraire</h2>
              <DeliveryMap
                destinationLat={order.delivery_latitude}
                destinationLng={order.delivery_longitude}
                showRoute={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
