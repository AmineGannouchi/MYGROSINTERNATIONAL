import { Filter, Search, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price_per_unit: number;
  unit: string;
  moq: number;
  stock_quantity: number;
  origin_country: string;
  featured: boolean;
  supplier: {
    name: string;
  };
  category: {
    name: string;
  };
  product_images: Array<{
    id: string;
    url: string;
  }>;
}

export default function Catalogue() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price_per_unit,
          unit,
          moq,
          stock_quantity,
          origin_country,
          featured,
          supplier:companies!products_supplier_id_fkey (name),
          category:categories (name),
          product_images (id, url)
        `)
        .eq('available', true)
        .order('featured', { ascending: false })
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Catalogue Produits</h1>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="Olives et Condiments">Olives et Condiments</option>
              <option value="Épicerie">Épicerie</option>
            </select>

            <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des produits...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative overflow-hidden">
                  {product.product_images?.[0]?.url ? (
                    <img
                      src={product.product_images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-green-800 font-semibold text-lg">{product.name}</p>
                    </div>
                  )}
                  {product.featured && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                      Vedette
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      {product.category?.name}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Fournisseur:</span>
                      <span className="font-medium">{product.supplier?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Origine:</span>
                      <span className="font-medium">{product.origin_country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MOQ:</span>
                      <span className="font-medium">{product.moq} {product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span className={`font-medium ${product.stock_quantity < 50 ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock_quantity} {product.unit}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {product.price_per_unit.toFixed(2)}€
                        </p>
                        <p className="text-xs text-gray-500">par {product.unit}</p>
                      </div>
                    </div>

                    {!isAdmin && (
                      <button
                        onClick={() => handleAddToCart(product.id, product.moq)}
                        disabled={addingToCart === product.id}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{addingToCart === product.id ? 'Ajout...' : 'Ajouter au panier'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
