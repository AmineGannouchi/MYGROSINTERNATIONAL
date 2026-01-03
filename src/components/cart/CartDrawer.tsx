import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, loading, updateQuantity, removeItem, getCartTotal, getItemsBySupplier } = useCart();

  if (!isOpen) return null;

  const itemsBySupplier = getItemsBySupplier();

  const handleCheckout = () => {
    onClose();
    window.history.pushState({}, '', '/checkout');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Panier</h2>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(itemsBySupplier.entries()).map(([supplierId, supplierItems]) => (
                <div key={supplierId} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{supplierItems[0].product.supplier?.name || 'Fournisseur'}</span>
                  </h3>

                  <div className="space-y-3">
                    {supplierItems.map((item) => (
                      <div key={item.id} className="bg-white rounded p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {item.product.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.product.price_per_unit.toFixed(2)} / {item.product.unit}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          <span className="font-semibold text-green-600">
                            {(item.product.price_per_unit * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">{getCartTotal().toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Commander
            </button>
          </div>
        )}
      </div>
    </>
  );
}
