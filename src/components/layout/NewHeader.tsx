import { ShoppingCart, User, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import CartDrawer from '../cart/CartDrawer';
import AuthModal from '../auth/AuthModal';

export default function NewHeader() {
  const { user, profile, signOut } = useAuth();
  const { items } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo-nv-mygros.png" alt="MYGROS" className="h-14 w-14 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-green-700">MYGROS INTERNATIONAL</h1>
              <p className="text-xs text-gray-600">Grossiste saveurs méditerranéennes</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {profile?.role === 'buyer' && (
                  <button onClick={() => setCartOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-md">
                    <ShoppingCart className="w-6 h-6 text-gray-700" />
                    {items.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {items.length}
                      </span>
                    )}
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{profile?.first_name}</span>
                  <button onClick={() => signOut()} className="p-2 hover:bg-gray-100 rounded-md" title="Déconnexion">
                    <LogOut className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setAuthModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Connexion / Inscription
              </button>
            )}
          </div>
        </div>

        <nav className="hidden lg:flex items-center space-x-6 pb-4 border-b text-sm">
          <Link to="/" className={isActive('/') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Accueil</Link>

          {!user && (
            <>
              <Link to="/catalogue" className={isActive('/catalogue') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Catalogue</Link>
              <Link to="/about" className={isActive('/about') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Qui sommes-nous</Link>
              <Link to="/contact" className={isActive('/contact') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Contact</Link>
            </>
          )}

          {profile?.role === 'buyer' && (
            <>
              <Link to="/client/catalogue" className={isActive('/client/catalogue') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Catalogue</Link>
              <Link to="/client/orders" className={isActive('/client/orders') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Mes Commandes</Link>
              <Link to="/client/promo" className={isActive('/client/promo') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Mes Avantages</Link>
              <Link to="/client/messages" className={isActive('/client/messages') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Messages</Link>
            </>
          )}

          {profile?.role === 'driver' && (
            <>
              <Link to="/driver/deliveries" className={isActive('/driver/deliveries') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Mes Livraisons</Link>
              <Link to="/driver/messages" className={isActive('/driver/messages') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Messages</Link>
              <Link to="/visits" className={isActive('/visits') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Visites</Link>
            </>
          )}

          {(profile?.role === 'admin' || profile?.role === 'commercial') && (
            <>
              <Link to="/admin" className={isActive('/admin') && location.pathname === '/admin' ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Dashboard</Link>
              <Link to="/admin/products" className={isActive('/admin/products') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Produits</Link>
              <Link to="/admin/orders" className={isActive('/admin/orders') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Commandes</Link>
              <Link to="/admin/tracking" className={isActive('/admin/tracking') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Suivi</Link>
              <Link to="/admin/messages" className={isActive('/admin/messages') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Messages</Link>
              <Link to="/admin/users-list" className={isActive('/admin/users-list') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Utilisateurs</Link>
              <Link to="/admin/visits" className={isActive('/admin/visits') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Visites</Link>
              <Link to="/admin/access-requests" className={isActive('/admin/access-requests') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Accès</Link>
              <Link to="/admin/contact-inbox" className={isActive('/admin/contact-inbox') ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600'}>Contact</Link>
            </>
          )}
        </nav>
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
