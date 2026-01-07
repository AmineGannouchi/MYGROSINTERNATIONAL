import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Delivery {
  id: string;
  order_id: string;
  status: string;
  eta_minutes: number | null;
  distance_km: number | null;
  orders: {
    id: string;
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
  };
}

export default function DriverDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDeliveries();
  }, [user]);

  const loadDeliveries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select(`
          *,
          orders (
            id,
            total_amount,
            delivery_address,
            delivery_city,
            delivery_latitude,
            delivery_longitude,
            profiles:buyer_user_id (first_name, last_name, phone)
          )
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setDeliveries(data as any);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'preparing':
        return 'En préparation';
      case 'out_for_delivery':
        return 'En livraison';
      case 'delivered':
        return 'Livré';
      default:
        return status;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes livraisons</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              onClick={() => navigate(`/driver/deliveries/${delivery.order_id}`)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Commande #{delivery.orders.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {delivery.orders.profiles.first_name} {delivery.orders.profiles.last_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      delivery.status
                    )}`}
                  >
                    {getStatusLabel(delivery.status)}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    {delivery.orders.delivery_address}, {delivery.orders.delivery_city}
                  </p>
                </div>

                {delivery.distance_km && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <p>
                      {delivery.distance_km.toFixed(1)} km
                      {delivery.eta_minutes && ` - ${delivery.eta_minutes} min`}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-lg font-bold text-green-600">
                    {delivery.orders.total_amount.toFixed(2)}€
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {deliveries.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Aucune livraison assignée</p>
          </div>
        )}
      </div>
    </div>
  );
}
