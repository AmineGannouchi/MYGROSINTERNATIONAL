import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import About from './pages/About';
import Contact from './pages/Contact';
import Messages from './pages/Messages';
import VisitReports from './pages/VisitReports';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import AdminOrderValidation from './pages/AdminOrderValidation';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderPage = () => {
    if (currentPath.startsWith('/dashboard/orders/')) {
      return <OrderDetails />;
    }

    switch (currentPath) {
      case '/catalogue':
        return <Catalogue />;
      case '/about':
        return <About />;
      case '/contact':
        return <Contact />;
      case '/messages':
        return <Messages />;
      case '/visits':
        return <VisitReports />;
      case '/dashboard':
        return <Dashboard />;
      case '/dashboard/orders':
        return <Orders />;
      case '/dashboard/admin/orders':
        return <AdminOrderValidation />;
      case '/admin':
        return <AdminDashboard />;
      case '/admin/products':
        return <AdminProducts />;
      case '/checkout':
        return <Checkout />;
      default:
        return <Home />;
    }
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header currentPath={currentPath} onNavigate={setCurrentPath} />
          <main className="flex-1">
            {renderPage()}
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
