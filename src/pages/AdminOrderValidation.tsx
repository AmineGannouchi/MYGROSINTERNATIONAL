import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Package, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_zone: string;
  delivery_city: string;
  delivery_address: string;
  created_at: string;
  buyer: {
    name: string;
  };
  buyer_user: {
    email: string;
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

export default function AdminOrderValidation() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:companies!orders_buyer_id_fkey (name),
          buyer_user:profiles!orders_buyer_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products (name, unit)
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error loading order items:', error);
    }
  };

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes('');
    await loadOrderItems(order.id);
  };

  const handleValidateOrder = async () => {
    if (!selectedOrder || !profile) return;

    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          validated_by: profile.user_id,
          validated_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .update({
          status: 'confirmed'
        })
        .eq('order_id', selectedOrder.id);

      if (trackingError) throw trackingError;

      await loadOrders();
      setSelectedOrder(null);
      setOrderItems([]);
      alert('Commande validée avec succès!');
    } catch (error) {
      console.error('Error validating order:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !profile) return;
    if (!adminNotes.trim()) {
      alert('Veuillez indiquer une raison pour le refus');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          validated_by: profile.user_id,
          validated_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      await loadOrders();
      setSelectedOrder(null);
      setOrderItems([]);
      alert('Commande refusée');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Accès réservé aux administrateurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation des commandes</h1>
          <p className="text-gray-600">Approuvez ou rejetez les commandes des clients</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
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
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Validées
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <XCircle className="w-4 h-4 inline mr-1" />
              Refusées
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Liste des commandes ({orders.length})
            </h2>

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune commande trouvée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {order.order_number}
                          </h3>
                          {order.status === 'pending' && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                              En attente
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Client:</span> {order.buyer?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Livraison:</span>{' '}
                          {order.delivery_zone === 'lyon' ? 'Lyon' : 'France'} - {order.delivery_city}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">
                          {order.total_amount.toFixed(2)}€
                        </p>
                        <button className="mt-1 text-green-600 hover:text-green-700 text-sm font-medium flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky top-4">
            {selectedOrder ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Détails de la commande
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Numéro de commande</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.order_number}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.buyer?.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Adresse de livraison</p>
                    <p className="text-gray-900">{selectedOrder.delivery_address}</p>
                    <p className="text-gray-900">
                      {selectedOrder.delivery_city}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Mode de paiement</p>
                    <p className="text-gray-900">
                      {selectedOrder.payment_status === 'paid' && 'Carte bancaire'}
                      {selectedOrder.payment_status === 'pending' && 'En attente'}
                      {selectedOrder.payment_status === 'credit_30' && 'Crédit B2B 30 jours'}
                      {selectedOrder.payment_status === 'credit_60' && 'Crédit B2B 60 jours'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Articles</h3>
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product.name} ({item.quantity} {item.product.unit})
                        </span>
                        <span className="font-medium text-gray-900">
                          {item.subtotal.toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{selectedOrder.total_amount.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'pending' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes administratives (optionnel)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ajouter des notes pour le client..."
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleValidateOrder}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {processing ? 'Validation...' : 'Valider'}
                      </button>

                      <button
                        onClick={handleRejectOrder}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        {processing ? 'Refus...' : 'Refuser'}
                      </button>
                    </div>
                  </>
                )}

                {selectedOrder.status !== 'pending' && (
                  <div className={`p-4 rounded-lg ${
                    selectedOrder.status === 'confirmed' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      selectedOrder.status === 'confirmed' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {selectedOrder.status === 'confirmed' ? 'Commande validée' : 'Commande refusée'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Sélectionnez une commande pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
