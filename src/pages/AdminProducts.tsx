import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Upload, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price_per_unit: number;
  unit: string;
  moq: number;
  stock_quantity: number;
  category_id: string;
  supplier_id: string;
  available: boolean;
  featured: boolean;
  origin_country: string;
  category: {
    name: string;
  };
  product_images: Array<{
    id: string;
    url: string;
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
}

export default function AdminProducts() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_unit: '',
    unit: 'kg',
    moq: '1',
    stock_quantity: '0',
    category_id: '',
    supplier_id: '',
    origin_country: '',
    available: true,
    featured: false
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadProducts();
      loadCategories();
      loadSuppliers();
    }
  }, [profile]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories (name),
          product_images (id, url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('company_type', 'supplier')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Maximum 5 Mo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price_per_unit: parseFloat(formData.price_per_unit),
        unit: formData.unit,
        moq: parseInt(formData.moq),
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: formData.category_id,
        supplier_id: formData.supplier_id,
        origin_country: formData.origin_country,
        available: formData.available,
        featured: formData.featured
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        if (selectedFile) {
          const imageUrl = await uploadImage(editingProduct.id);
          if (imageUrl) {
            await supabase
              .from('product_images')
              .insert({
                product_id: editingProduct.id,
                url: imageUrl,
                display_order: 0
              });
          }
        }

        alert('Produit mis à jour avec succès!');
      } else {
        const { data: product, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        if (selectedFile && product) {
          const imageUrl = await uploadImage(product.id);
          if (imageUrl) {
            await supabase
              .from('product_images')
              .insert({
                product_id: product.id,
                url: imageUrl,
                display_order: 0
              });
          }
        }

        alert('Produit créé avec succès!');
      }

      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde du produit');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price_per_unit: product.price_per_unit.toString(),
      unit: product.unit,
      moq: product.moq.toString(),
      stock_quantity: product.stock_quantity.toString(),
      category_id: product.category_id || '',
      supplier_id: product.supplier_id,
      origin_country: product.origin_country || '',
      available: product.available,
      featured: product.featured
    });
    if (product.product_images?.[0]?.url) {
      setPreviewUrl(product.product_images[0].url);
    }
    setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      alert('Produit supprimé avec succès');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_per_unit: '',
      unit: 'kg',
      moq: '1',
      stock_quantity: '0',
      category_id: '',
      supplier_id: '',
      origin_country: '',
      available: true,
      featured: false
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setEditingProduct(null);
    setShowModal(false);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des produits</h1>
            <p className="text-gray-600">Ajoutez, modifiez ou supprimez des produits</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un produit</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucun produit pour le moment</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Créer le premier produit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
                  {product.product_images?.[0]?.url ? (
                    <img
                      src={product.product_images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-green-600" />
                  )}
                  {product.featured && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                      Vedette
                    </span>
                  )}
                  {!product.available && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Indisponible
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

                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>Prix: <span className="font-medium">{product.price_per_unit}€/{product.unit}</span></p>
                    <p>MOQ: <span className="font-medium">{product.moq} {product.unit}</span></p>
                    <p>Stock: <span className="font-medium">{product.stock_quantity} {product.unit}</span></p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex items-center justify-center bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Olives vertes Kalamata"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie *
                      </label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fournisseur *
                      </label>
                      <select
                        required
                        value={formData.supplier_id}
                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Sélectionner</option>
                        {suppliers.map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="45"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unité *
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="kg">kg</option>
                        <option value="carton">carton</option>
                        <option value="palette">palette</option>
                        <option value="unité">unité</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MOQ *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.moq}
                        onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock disponible
                      </label>
                      <input
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays d'origine
                      </label>
                      <input
                        type="text"
                        value={formData.origin_country}
                        onChange={(e) => setFormData({ ...formData, origin_country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Grèce"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Description détaillée du produit..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photo du produit (max 5 Mo)
                    </label>
                    <div className="flex items-start space-x-4">
                      {previewUrl && (
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt="Aperçu"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl('');
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Cliquez pour télécharger une image
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5 Mo</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Produit disponible</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Produit vedette</span>
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {uploading ? 'Enregistrement...' : editingProduct ? 'Mettre à jour' : 'Créer le produit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
