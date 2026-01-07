import { useState, useEffect } from 'react';
import { Gift, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PromoRule {
  id: string;
  name: string;
  threshold_total_spent: number;
  delivery_discount_amount: number;
  percent_discount: number;
  active: boolean;
}

export default function ClientPromo() {
  const [totalSpent, setTotalSpent] = useState(0);
  const [promoRules, setPromoRules] = useState<PromoRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [ordersResult, rulesResult] = await Promise.all([
        supabase
          .from('orders')
          .select('total_amount')
          .eq('buyer_user_id', user.id)
          .in('status', ['confirmed', 'delivered']),
        supabase
          .from('promo_rules')
          .select('*')
          .eq('active', true)
          .order('threshold_total_spent'),
      ]);

      if (ordersResult.data) {
        const total = ordersResult.data.reduce((sum, order) => sum + order.total_amount, 0);
        setTotalSpent(total);
      }

      if (rulesResult.data) {
        setPromoRules(rulesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = () => {
    return promoRules
      .filter((rule) => totalSpent >= rule.threshold_total_spent)
      .sort((a, b) => b.threshold_total_spent - a.threshold_total_spent)[0];
  };

  const getNextTier = () => {
    return promoRules.find((rule) => totalSpent < rule.threshold_total_spent);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes avantages</h1>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Total dépensé</h2>
            </div>
            <p className="text-5xl font-bold mb-2">{totalSpent.toFixed(2)}€</p>
            {currentTier && (
              <p className="text-green-100 text-lg">
                Niveau actuel : {currentTier.name}
              </p>
            )}
          </div>

          {currentTier && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Vos avantages actuels
              </h3>
              <div className="space-y-3">
                {currentTier.delivery_discount_amount > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Frais de livraison offerts</p>
                      <p className="text-sm text-gray-600">
                        Économisez {currentTier.delivery_discount_amount}€ par commande
                      </p>
                    </div>
                  </div>
                )}
                {currentTier.percent_discount > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Gift className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Remise de {currentTier.percent_discount}%
                      </p>
                      <p className="text-sm text-gray-600">
                        Sur toutes vos commandes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {nextTier && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Prochain niveau : {nextTier.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progression</span>
                    <span>
                      {totalSpent.toFixed(0)}€ / {nextTier.threshold_total_spent}€
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-600 h-4 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (totalSpent / nextTier.threshold_total_spent) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Encore {(nextTier.threshold_total_spent - totalSpent).toFixed(2)}€ pour
                    débloquer ce niveau
                  </p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="font-medium text-gray-900">Avantages à débloquer :</p>
                  {nextTier.delivery_discount_amount > 0 && (
                    <p className="text-sm text-gray-600">
                      - Frais de livraison offerts ({nextTier.delivery_discount_amount}€)
                    </p>
                  )}
                  {nextTier.percent_discount > 0 && (
                    <p className="text-sm text-gray-600">
                      - Remise de {nextTier.percent_discount}% sur vos commandes
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Tous les niveaux</h3>
            <div className="space-y-3">
              {promoRules.map((rule) => {
                const isUnlocked = totalSpent >= rule.threshold_total_spent;
                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-lg border-2 ${
                      isUnlocked
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{rule.name}</p>
                        <p className="text-sm text-gray-600">
                          À partir de {rule.threshold_total_spent}€
                        </p>
                      </div>
                      {isUnlocked && (
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                          Débloqué
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
