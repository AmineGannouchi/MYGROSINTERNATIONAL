import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { useState } from 'react';
import SplashScreen from './components/SplashScreen';
import NewHeader from './components/layout/NewHeader';
import Footer from './components/layout/Footer';
import RequireAuth from './components/guards/RequireAuth';
import RequireRole from './components/guards/RequireRole';

import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import About from './pages/About';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';

import ClientPromo from './pages/client/ClientPromo';
import ClientAccessRequests from './pages/client/ClientAccessRequests';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Messages from './pages/Messages';

import DriverDeliveries from './pages/driver/DriverDeliveries';
import DriverDeliveryDetail from './pages/driver/DriverDeliveryDetail';

import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrderValidation from './pages/AdminOrderValidation';
import AdminAccessRequests from './pages/admin/AdminAccessRequests';
import AdminContactInbox from './pages/admin/AdminContactInbox';
import AdminTracking from './pages/admin/AdminTracking';
import VisitReports from './pages/VisitReports';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  setTimeout(() => setShowSplash(false), 1500);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <NewHeader />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalogue" element={<Catalogue />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                <Route path="/client/catalogue" element={<RequireAuth><Catalogue /></RequireAuth>} />
                <Route path="/client/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                <Route path="/client/orders/:orderId" element={<RequireAuth><OrderDetails /></RequireAuth>} />
                <Route path="/client/promo" element={<RequireAuth><ClientPromo /></RequireAuth>} />
                <Route path="/client/messages" element={<RequireAuth><Messages /></RequireAuth>} />
                <Route path="/client/access-requests" element={<RequireAuth><ClientAccessRequests /></RequireAuth>} />
                <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

                <Route path="/driver/deliveries" element={<RequireRole roles={['driver']}><DriverDeliveries /></RequireRole>} />
                <Route path="/driver/deliveries/:orderId" element={<RequireRole roles={['driver']}><DriverDeliveryDetail /></RequireRole>} />
                <Route path="/driver/messages" element={<RequireRole roles={['driver']}><Messages /></RequireRole>} />
                <Route path="/driver/access-requests" element={<RequireRole roles={['driver']}><ClientAccessRequests /></RequireRole>} />

                <Route path="/admin" element={<RequireRole roles={['admin', 'commercial']}><AdminDashboard /></RequireRole>} />
                <Route path="/admin/products" element={<RequireRole roles={['admin', 'commercial']}><AdminProducts /></RequireRole>} />
                <Route path="/admin/orders" element={<RequireRole roles={['admin', 'commercial']}><AdminOrderValidation /></RequireRole>} />
                <Route path="/admin/tracking" element={<RequireRole roles={['admin', 'commercial']}><AdminTracking /></RequireRole>} />
                <Route path="/admin/access-requests" element={<RequireRole roles={['admin']}><AdminAccessRequests /></RequireRole>} />
                <Route path="/admin/contact-inbox" element={<RequireRole roles={['admin', 'commercial']}><AdminContactInbox /></RequireRole>} />
                <Route path="/admin/messages" element={<RequireRole roles={['admin', 'commercial']}><Messages /></RequireRole>} />

                <Route path="/visits" element={<RequireRole roles={['admin', 'commercial', 'driver']}><VisitReports /></RequireRole>} />
                <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
