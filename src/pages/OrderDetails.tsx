import { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CreditCard, Truck, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useParams, navigate } from '../lib/navigation';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_zone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_time_slot: string | null;
  admin_notes: string | null;
  validated_at: string | null;
  created_at: string;
  buyer: {
    name: string;
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: {
    name: string;
    unit: string;
  };
}

interface DeliveryTracking {
  id: string;
  status: string;
  tracking_number: string | null;
  carrier: string;
  current_location: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  notes: string | null;
  updated_at: string;
}

const TRACKING_STEPS = [
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'preparing', label: 'En préparation' },
  { key: 'out_for_delivery', label: 'En livraison' },
  { key: 'delivered', label: 'Livrée' }
];

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId, user]);

  const loadOrderDetails = async () => {
    if (!orderId || !user) return;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:companies!orders_buyer_id_fkey (name)
        `)
        .eq('id', orderId)
        .eq('buyer_user_id', user.id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products (name, unit)
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      const { data: trackingData, error: trackingError } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (trackingError && trackingError.code !== 'PGRST116') throw trackingError;
      setTracking(trackingData);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement des détails...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Commande non trouvée</p>
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Retour aux commandes
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = TRACKING_STEPS.findIndex(step => step.key === tracking?.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <button
          onClick={() => navigate('/dashboard/orders')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour aux commandes</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Commande {order.order_number}
              </h1>
              <p className="text-gray-600">
                Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {order.total_amount.toFixed(2)}€
              </p>
            </div>
          </div>

          {order.status === 'pending' && !order.validated_at && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-amber-800 font-medium">
                  Votre commande est en attente de validation par MYGROS INTERNATIONAL
                </p>
              </div>
              <p className="text-sm text-amber-700 mt-2">
                Vous recevrez une notification dès que votre commande sera validée.
              </p>
            </div>
          )}

          {tracking && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-green-600" />
                Suivi de livraison
              </h2>

              <div className="relative">
                <div className="flex items-center justify-between">
                  {TRACKING_STEPS.map((step, index) => (
                    <div key={step.key} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index <= currentStepIndex
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {index <= currentStepIndex ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <div className="w-3 h-3 bg-gray-400 rounded-full" />
                          )}
                        </div>
                        <p className={`text-xs mt-2 text-center ${
                          index <= currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                      {index < TRACKING_STEPS.length - 1 && (
                        <div
                          className={`absolute top-5 left-1/2 w-full h-0.5 ${
                            index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                          style={{ transform: 'translateY(-50%)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {tracking.tracking_number && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Numéro de suivi:</span> {tracking.tracking_number}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Transporteur: {tracking.carrier === 'colissimo' ? 'Colissimo' : tracking.carrier === 'chronopost' ? 'Chronopost' : 'Livraison interne'}
                  </p>
                </div>
              )}

              {tracking.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{tracking.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Adresse de livraison
              </h3>
              <div className="text-gray-600">
                <p>{order.delivery_address}</p>
                <p>{order.delivery_postal_code} {order.delivery_city}</p>
                <p className="mt-2 text-sm">
                  Zone: {order.delivery_zone === 'lyon' ? 'Lyon Métropole + Corbas' : 'France entière'}
                </p>
                {order.delivery_time_slot && (
                  <p className="text-sm">
                    Créneau: {order.delivery_time_slot === 'morning' ? 'Matin (9h-12h)' : 'Après-midi (14h-18h)'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Paiement
              </h3>
              <div className="text-gray-600">
                <p>
                  Mode de paiement:{' '}
                  {order.payment_status === 'paid' && 'Carte bancaire (Payé)'}
                  {order.payment_status === 'pending' && 'En attente'}
                  {order.payment_status === 'credit_30' && 'Crédit B2B 30 jours'}
                  {order.payment_status === 'credit_60' && 'Crédit B2B 60 jours'}
                </p>
              </div>
            </div>
          </div>

          {order.admin_notes && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-1">Note de MYGROS:</p>
              <p className="text-sm text-blue-800">{order.admin_notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-green-600" />
            Articles commandés
          </h2>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} {item.product.unit} × {item.unit_price.toFixed(2)}€
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {item.subtotal.toFixed(2)}€
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{order.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frais de livraison</span>
              <span>{order.delivery_fee.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
              <span>Total</span>
              <span>{order.total_amount.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
