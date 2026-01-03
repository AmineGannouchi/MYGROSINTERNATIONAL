import { Award, Globe, Target, Users } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Qui sommes-nous</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Votre partenaire de confiance pour les produits méditerranéens de qualité
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              MYGROS INTERNATIONAL
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Depuis plus de 15 ans, MYGROS INTERNATIONAL est le spécialiste de la distribution en gros
                de produits méditerranéens de qualité. Basés à Corbas, près de Lyon, nous servons les
                professionnels de la restauration, les épiceries fines et les commerces de détail dans
                toute la région.
              </p>
              <p>
                Notre expertise couvre deux domaines principaux : les olives et condiments méditerranéens
                (olives, tapenades, anchois, sauces), ainsi qu'une large gamme de produits d'épicerie
                (pâtes authentiques, couscous, produits secs).
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-8 text-white">
            <img
              src="/logo-nv-mygros.png"
              alt="MYGROS INTERNATIONAL"
              className="h-32 w-32 mx-auto mb-6"
            />
            <div className="text-center space-y-4">
              <div>
                <div className="text-4xl font-bold mb-2">15+</div>
                <p className="text-green-100">Années d'expérience</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <p className="text-green-100">Clients professionnels</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Award className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Qualité Premium</h3>
            <p className="text-gray-600">
              Produits sélectionnés avec soin
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Globe className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Origine Garantie</h3>
            <p className="text-gray-600">
              Traçabilité complète
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Target className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Service B2B</h3>
            <p className="text-gray-600">
              Solutions sur mesure
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Accompagnement</h3>
            <p className="text-gray-600">
              Équipe dédiée
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
