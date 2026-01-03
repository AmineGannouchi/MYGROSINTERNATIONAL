import { Package, Truck, Shield, Star, ArrowRight, ShoppingCart, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { navigate } from '../lib/navigation';

interface FeaturedProduct {
  id: string;
  name: string;
  price_per_unit: number;
  unit: string;
  moq: number;
  stock_quantity: number;
  product_images: Array<{
    url: string;
  }>;
}

interface Stats {
  totalRevenue: number;
  olivesRevenue: number;
  epicerieRevenue: number;
  pendingOrders: number;
}

export default function Home() {
  const { user, profile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    olivesRevenue: 0,
    epicerieRevenue: 0,
    pendingOrders: 0
  });
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (user) {
      loadFeaturedProducts();
      if (isAdmin) {
        loadStats();
      }
    }
  }, [user, isAdmin]);

  const loadFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_per_unit,
          unit,
          moq,
          stock_quantity,
          product_images (url)
        `)
        .eq('available', true)
        .eq('featured', true)
        .order('name')
        .limit(6);

      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status');

      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          subtotal,
          product:products (
            category:categories (name)
          )
        `);

      const totalRevenue = orders?.reduce((sum, order) => {
        return order.status !== 'cancelled' ? sum + Number(order.total_amount) : sum;
      }, 0) || 0;

      let olivesRevenue = 0;
      let epicerieRevenue = 0;

      orderItems?.forEach((item) => {
        const categoryName = item.product?.category?.name || '';
        const subtotal = Number(item.subtotal);

        if (categoryName.toLowerCase().includes('olive') || categoryName.toLowerCase().includes('condiment')) {
          olivesRevenue += subtotal;
        } else {
          epicerieRevenue += subtotal;
        }
      });

      const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalRevenue,
        olivesRevenue,
        epicerieRevenue,
        pendingOrders: pendingCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddToCart = async (productId: string, moq: number) => {
    setAddingToCart(productId);
    try {
      await addToCart(productId, moq);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <img
              src="/logo-nv-mygros.png"
              alt="MYGROS INTERNATIONAL"
              className="h-32 w-32 mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              MYGROS INTERNATIONAL
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Grossiste Olives Lyon - Livraison J+1 Corbas 69960
            </p>
          </div>

          <div className="flex justify-center mb-16">
            {showAuth ? (
              authMode === 'login' ? (
                <LoginForm onToggle={() => setAuthMode('register')} />
              ) : (
                <RegisterForm onToggle={() => setAuthMode('login')} />
              )
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
              >
                S'inscrire B2B
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Large Catalogue</h3>
              <p className="text-sm text-gray-600">
                Olives, condiments et épicerie méditerranéenne
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Truck className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Livraison Rapide</h3>
              <p className="text-sm text-gray-600">
                Livraison Lyon/Corbas J+1
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Qualité Garantie</h3>
              <p className="text-sm text-gray-600">
                Produits authentiques de qualité supérieure
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Star className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Service B2B</h3>
              <p className="text-sm text-gray-600">
                Solutions adaptées aux professionnels
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section
        className="relative h-[500px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://images.pexels.com/photos/1437603/pexels-photo-1437603.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="container mx-auto px-4 text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            MYGROS INTERNATIONAL
          </h1>
          <p className="text-2xl mb-2">
            Grossiste Olives Lyon - Livraison J+1 Corbas 69960
          </p>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl">
            Olives, Tapenades, Anchois, Pâtes - Qualité supérieure pour professionnels
          </p>
          <button
            onClick={() => navigate('/catalogue')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
          >
            <span>Découvrir le catalogue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Nos Catégories</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <button
            onClick={() => navigate('/catalogue')}
            className="group relative h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
          >
            <img
              src="https://capolives.fr/wp-content/uploads/2024/05/Olives-vertes-cassees-fraiches-300x300.jpg"
              alt="Olives et Condiments"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-3xl font-bold text-white mb-2">Olives & Condiments</h3>
              <p className="text-gray-200">Olives, tapenades de qualité premium</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/catalogue')}
            className="group relative h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
          >
            <img
              src="https://capolives.fr/wp-content/uploads/2025/06/SICAM-300x300.png"
              alt="Épicerie"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-3xl font-bold text-white mb-2">Épicerie</h3>
              <p className="text-gray-200">Tomates concentrées, harissa, boissons</p>
            </div>
          </button>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Chiffre d'affaires par catégorie
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <p className="text-sm text-green-700 mb-2">CA Total</p>
                <p className="text-3xl font-bold text-green-900">
                  {stats.totalRevenue.toFixed(2)}€
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg">
                <p className="text-sm text-amber-700 mb-2">Olives & Condiments</p>
                <p className="text-3xl font-bold text-amber-900">
                  {stats.olivesRevenue.toFixed(2)}€
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  {stats.totalRevenue > 0
                    ? ((stats.olivesRevenue / stats.totalRevenue) * 100).toFixed(1)
                    : 0}% du CA
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Épicerie</p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats.epicerieRevenue.toFixed(2)}€
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  {stats.totalRevenue > 0
                    ? ((stats.epicerieRevenue / stats.totalRevenue) * 100).toFixed(1)
                    : 0}% du CA
                </p>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
              className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => navigate('/admin/products')}
            >
              <Package className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">AJOUTER PRODUIT</h3>
              <p className="text-sm text-red-100">
                Créer de nouveaux produits avec photos
              </p>
            </div>

            <div
              className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => navigate('/dashboard/admin/orders')}
            >
              <Clock className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">COMMANDES EN ATTENTE</h3>
              <p className="text-sm text-red-100 flex items-center">
                {stats.pendingOrders > 0 && (
                  <AlertCircle className="w-4 h-4 mr-2 animate-pulse" />
                )}
                {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} à valider
              </p>
            </div>
          </div>
        )}
      </section>

      {featuredProducts.length > 0 && (
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Produits Phares</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 overflow-hidden">
                    {product.product_images?.[0]?.url ? (
                      <img
                        src={product.product_images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-3">{product.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {product.price_per_unit.toFixed(2)}€
                        </p>
                        <p className="text-sm text-gray-500">par {product.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stock: {product.stock_quantity}</p>
                      </div>
                    </div>
                    {!isAdmin && (
                      <button
                        onClick={() => handleAddToCart(product.id, product.moq)}
                        disabled={addingToCart === product.id}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{addingToCart === product.id ? 'Ajout...' : 'Ajouter au panier'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isAdmin && (
              <div className="text-center mt-8">
                <button
                  onClick={() => navigate('/catalogue')}
                  className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-semibold text-lg"
                >
                  <span>Voir tous les produits</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Large Catalogue</h3>
              <p className="text-sm text-gray-600">
                Produits méditerranéens premium
              </p>
            </div>

            <div className="text-center">
              <Truck className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Livraison Rapide</h3>
              <p className="text-sm text-gray-600">
                Lyon/Corbas J+1 - France 2-3 jours
              </p>
            </div>

            <div className="text-center">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Qualité Garantie</h3>
              <p className="text-sm text-gray-600">
                Produits authentiques sélectionnés
              </p>
            </div>

            <div className="text-center">
              <Star className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Service B2B</h3>
              <p className="text-sm text-gray-600">
                7 Av. Montmartin, 69960 Corbas
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
