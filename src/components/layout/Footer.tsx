import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">MYGROS INTERNATIONAL</h3>
            <p className="text-gray-400 text-sm mb-4">
              Votre source de choix pour un approvisionnement de qualité en olives, tapenades, anchois, pâtes
            </p>
            <img
              src="/logo-nv-mygros.png"
              alt="MYGROS INTERNATIONAL"
              className="h-20 w-20 object-contain"
            />
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p>7 Av. de Montmartin</p>
                  <p>69960 Corbas, France</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:+33472185076" className="hover:text-white">
                  +33 4 72 18 50 76
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:mygroslm@gmail.com" className="hover:text-white">
                  mygroslm@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/" className="hover:text-white">Accueil</a>
              </li>
              <li>
                <a href="/products" className="hover:text-white">Produits</a>
              </li>
              <li>
                <a href="/about" className="hover:text-white">Qui sommes-nous</a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} MYGROS INTERNATIONAL. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
