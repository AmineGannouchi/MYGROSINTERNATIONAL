import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../lib/navigation';

interface Product {
  id: string;
  name: string;
  price_per_unit: number;
  unit: string;
  stock_quantity: number;
  category: {
    name: string;
  } | null;
}

interface Stats {
  totalRevenue: number;
  olivesRevenue: number;
  epicerieRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    olivesRevenue: 0,
    epicerieRevenue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadProducts();
      loadStats();
    }
  }, [profile]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_per_unit,
          unit,
          stock_quantity,
          category:categories (name)
        `)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
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

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    setDeletingId(productId);
    try {
      const { error: imagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (imagesError) throw imagesError;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression du produit');
    } finally {
      setDeletingId(null);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Produits
          </h1>
          <p className="text-gray-600">
            MYGROS INTERNATIONAL - Espace Administrateur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => navigate('/admin/products')}
          >
            <Plus className="w-12 h-12 mb-4 opacity-80" />
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Statistiques rapides
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
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">Épicerie</p>
              <p className="text-3xl font-bold text-blue-900">
                {stats.epicerieRevenue.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-green-600" />
              Liste des Produits ({products.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun produit</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.price_per_unit.toFixed(2)}€
                        </div>
                        <div className="text-xs text-gray-500">
                          par {product.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.stock_quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {product.category?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{deletingId === product.id ? 'Suppression...' : 'Supprimer'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
