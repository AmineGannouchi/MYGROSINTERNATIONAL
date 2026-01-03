import { ShoppingCart, User, Menu, Search, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import CartDrawer from '../cart/CartDrawer';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Header({ currentPath, onNavigate }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { items } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const navigate = (path: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    window.history.pushState({}, '', path);
    onNavigate(path);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-md">
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            <div className="flex items-center space-x-3">
              <img
                src="/logo-nv-mygros.png"
                alt="MYGROS INTERNATIONAL"
                className="h-14 w-14 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-green-700">MYGROS INTERNATIONAL</h1>
                <p className="text-xs text-gray-600">Grossiste spécialiste des saveurs méditerranéennes</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="w-full relative">
              <input
                type="text"
                placeholder="Rechercher des produits..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {profile?.role !== 'admin' && (
                  <button
                    onClick={() => setCartOpen(true)}
                    className="relative p-2 hover:bg-gray-100 rounded-md"
                  >
                    <ShoppingCart className="w-6 h-6 text-gray-700" />
                    {items.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {items.length}
                      </span>
                    )}
                  </button>
                )}

                <div className="flex items-center space-x-2">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <User className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="hidden md:block text-sm text-red-600 hover:text-red-700"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <User className="w-6 h-6 text-gray-700" />
              </div>
            )}
          </div>
        </div>

        <nav className="hidden lg:flex items-center space-x-8 pb-4 border-b">
          {profile?.role === 'admin' && (
            <a
              href="/admin/products"
              onClick={(e) => navigate('/admin/products', e)}
              className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-bold shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>AJOUTER PRODUIT</span>
            </a>
          )}
          <a
            href="/"
            onClick={(e) => navigate('/', e)}
            className={`font-medium ${
              currentPath === '/' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
            }`}
          >
            Accueil
          </a>
          {profile?.role !== 'admin' && (
            <a
              href="/catalogue"
              onClick={(e) => navigate('/catalogue', e)}
              className={`font-medium ${
                currentPath === '/catalogue' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Catalogue
            </a>
          )}
          {user && profile?.role !== 'admin' && (
            <>
              <a
                href="/dashboard/orders"
                onClick={(e) => navigate('/dashboard/orders', e)}
                className={`font-medium ${
                  currentPath.startsWith('/dashboard/orders') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Mes Commandes
              </a>
              <a
                href="/messages"
                onClick={(e) => navigate('/messages', e)}
                className={`font-medium ${
                  currentPath === '/messages' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Messages
              </a>
            </>
          )}
          {(profile?.role === 'admin' || profile?.role === 'commercial') && (
            <>
              <a
                href="/admin"
                onClick={(e) => navigate('/admin', e)}
                className={`font-medium ${
                  currentPath.startsWith('/admin') ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Admin
              </a>
              <a
                href="/messages"
                onClick={(e) => navigate('/messages', e)}
                className={`font-medium ${
                  currentPath === '/messages' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Messages
              </a>
              <a
                href="/visits"
                onClick={(e) => navigate('/visits', e)}
                className={`font-medium ${
                  currentPath === '/visits' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Visites
              </a>
            </>
          )}
          {profile?.role === 'admin' && (
            <a
              href="/dashboard"
              onClick={(e) => navigate('/dashboard', e)}
              className={`font-medium ${
                currentPath === '/dashboard' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
              }`}
            >
              Dashboard
            </a>
          )}
          {profile?.role !== 'admin' && (
            <>
              <a
                href="/about"
                onClick={(e) => navigate('/about', e)}
                className={`font-medium ${
                  currentPath === '/about' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Qui sommes-nous
              </a>
              <a
                href="/contact"
                onClick={(e) => navigate('/contact', e)}
                className={`font-medium ${
                  currentPath === '/contact' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Contact
              </a>
            </>
          )}
        </nav>
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
