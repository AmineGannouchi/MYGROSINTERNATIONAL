import { useState, useEffect } from 'react';
import { MapPin, Clock, CreditCard, FileText } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/navigation';

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  freeShippingThreshold: number;
  description: string;
  timeSlots: string[];
}

const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'lyon',
    name: 'Lyon Métropole + Corbas (69960)',
    fee: 8,
    freeShippingThreshold: 200,
    description: 'Livraison J+0 ou J+1 - Suivi GPS en temps réel',
    timeSlots: ['morning', 'afternoon']
  },
  {
    id: 'france',
    name: 'France entière (hors Lyon)',
    fee: 15,
    freeShippingThreshold: 0,
    description: 'Livraison J+2 à J+4 - Suivi Colissimo/Chronopost',
    timeSlots: []
  }
];

export default function Checkout() {
  const { items, getCartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [selectedZone, setSelectedZone] = useState<string>('lyon');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('morning');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [deliveryAddress, setDeliveryAddress] = useState({
    address: '',
    city: '',
    postalCode: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/products');
    }
  }, [items, navigate]);

  const zone = DELIVERY_ZONES.find(z => z.id === selectedZone)!;
  const subtotal = getCartTotal();
  const deliveryFee = subtotal >= zone.freeShippingThreshold && zone.freeShippingThreshold > 0 ? 0 : zone.fee;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_user_id: user.id,
          buyer_id: profile.company_id,
          status: 'pending',
          payment_status: paymentMethod === 'card' ? 'pending' : paymentMethod,
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: total,
          delivery_zone: selectedZone,
          delivery_address: deliveryAddress.address,
          delivery_city: deliveryAddress.city,
          delivery_postal_code: deliveryAddress.postalCode,
          delivery_time_slot: selectedTimeSlot || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        supplier_id: item.product.supplier_id,
        quantity: item.quantity,
        unit_price: item.product.price_per_unit,
        subtotal: item.product.price_per_unit * item.quantity,
        total_price: item.product.price_per_unit * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: trackingError } = await supabase
        .from('delivery_tracking')
        .insert({
          order_id: order.id,
          status: 'pending',
          carrier: selectedZone === 'lyon' ? 'internal' : 'colissimo'
        });

      if (trackingError) throw trackingError;

      await clearCart();

      navigate(`/dashboard/orders/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Erreur lors de la création de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Zone de livraison
              </h2>

              <div className="space-y-4">
                {DELIVERY_ZONES.map((zone) => (
                  <label
                    key={zone.id}
                    className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedZone === zone.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="zone"
                      value={zone.id}
                      checked={selectedZone === zone.id}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{zone.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                        {zone.freeShippingThreshold > 0 && (
                          <p className="text-xs text-green-600 mt-2">
                            Gratuit au-dessus de {zone.freeShippingThreshold}€
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">{zone.fee}€</p>
                        {subtotal >= zone.freeShippingThreshold && zone.freeShippingThreshold > 0 && (
                          <p className="text-xs text-green-600 font-semibold">GRATUIT</p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {selectedZone === 'lyon' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-green-600" />
                  Créneau de livraison
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTimeSlot === 'morning'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeSlot"
                      value="morning"
                      checked={selectedTimeSlot === 'morning'}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="sr-only"
                    />
                    <p className="font-semibold text-gray-900 text-center">Matin</p>
                    <p className="text-sm text-gray-600 text-center mt-1">9h - 12h</p>
                  </label>

                  <label
                    className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTimeSlot === 'afternoon'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeSlot"
                      value="afternoon"
                      checked={selectedTimeSlot === 'afternoon'}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="sr-only"
                    />
                    <p className="font-semibold text-gray-900 text-center">Après-midi</p>
                    <p className="text-sm text-gray-600 text-center mt-1">14h - 18h</p>
                  </label>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                Adresse de livraison
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="12 Rue de la République"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Lyon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="69000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Mode de paiement
              </h2>

              <div className="space-y-3">
                <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'card' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Carte bancaire (Stripe)</span>
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Paiement sécurisé</p>
                </label>

                <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'credit_30' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="credit_30"
                    checked={paymentMethod === 'credit_30'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Crédit B2B 30 jours</span>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Paiement différé pour professionnels</p>
                </label>

                <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'credit_60' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="credit_60"
                    checked={paymentMethod === 'credit_60'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Crédit B2B 60 jours</span>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Paiement différé pour professionnels</p>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Récapitulatif</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total ({items.length} articles)</span>
                  <span>{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frais de livraison</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                    {deliveryFee === 0 ? 'GRATUIT' : `${deliveryFee.toFixed(2)}€`}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
              >
                {submitting ? 'Création...' : 'Confirmer la commande'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Votre commande sera validée par MYGROS avant préparation
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
