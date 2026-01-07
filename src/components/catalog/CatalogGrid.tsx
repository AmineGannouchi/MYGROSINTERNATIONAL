import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  sku: string;
  price_per_unit: number;
  unit_type: string;
  category_id: string;
  image_url: string | null;
  description: string | null;
  active: boolean;
  categories: { name: string };
}

interface CatalogGridProps {
  adminMode?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onToggleActive?: (productId: string, active: boolean) => void;
}

export default function CatalogGrid({
  adminMode = false,
  onEdit,
  onDelete,
  onToggleActive,
}: CatalogGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('*, categories(name)')
          .order('name'),
        supabase.from('categories').select('id, name').order('name'),
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (categoriesResult.data) setCategories(categoriesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = products.filter((p) => {
      if (!adminMode && !p.active) return false;

      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || p.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return a.price_per_unit - b.price_per_unit;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    addItem(product.id, product, 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="name">Trier par nom</option>
            <option value="price">Trier par prix</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${
              !product.active && adminMode ? 'opacity-60' : ''
            }`}
          >
            <div className="relative h-48 bg-gray-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingCart className="w-16 h-16" />
                </div>
              )}
              {adminMode && (
                <div className="absolute top-2 right-2 flex gap-2">
                  {onToggleActive && (
                    <button
                      onClick={() => onToggleActive(product.id, !product.active)}
                      className={`p-2 rounded-full ${
                        product.active ? 'bg-green-600' : 'bg-gray-600'
                      } text-white hover:opacity-80`}
                      title={product.active ? 'Actif' : 'Inactif'}
                    >
                      {product.active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                  <p className="text-xs text-gray-600 mt-1">{product.categories.name}</p>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {product.price_per_unit.toFixed(2)}€
                  </p>
                  <p className="text-xs text-gray-500">par {product.unit_type}</p>
                </div>

                {adminMode && onEdit && onDelete ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  profile?.role !== 'admin' &&
                  profile?.role !== 'driver' && (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Ajouter
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun produit trouvé
        </div>
      )}
    </div>
  );
}
