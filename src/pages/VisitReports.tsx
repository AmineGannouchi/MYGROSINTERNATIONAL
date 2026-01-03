import { useState, useEffect } from 'react';
import { MapPin, Camera, Plus, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VisitReport {
  id: string;
  client_name: string;
  client_address: string;
  client_city: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  visit_date: string;
  created_at: string;
  commercial: {
    first_name: string;
    last_name: string;
  };
  photos: Array<{
    id: string;
    photo_url: string;
    caption: string;
  }>;
}

export default function VisitReports() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_address: '',
    client_city: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReports();
  }, [user, profile]);

  const loadReports = async () => {
    try {
      let query = supabase
        .from('visit_reports')
        .select(`
          id,
          client_name,
          client_address,
          client_city,
          latitude,
          longitude,
          notes,
          visit_date,
          created_at,
          commercial:profiles!visit_reports_commercial_id_fkey (
            first_name,
            last_name
          ),
          photos:visit_photos (
            id,
            photo_url,
            caption
          )
        `)
        .order('visit_date', { ascending: false });

      if (profile?.role === 'commercial') {
        query = query.eq('commercial_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      let latitude = null;
      let longitude = null;

      try {
        const position = await getCurrentLocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoError) {
        console.warn('Could not get location:', geoError);
      }

      const { error } = await supabase
        .from('visit_reports')
        .insert({
          commercial_id: user.id,
          client_name: formData.client_name,
          client_address: formData.client_address,
          client_city: formData.client_city,
          notes: formData.notes,
          latitude,
          longitude,
        });

      if (error) throw error;

      setFormData({
        client_name: '',
        client_address: '',
        client_city: '',
        notes: '',
      });
      setShowForm(false);
      await loadReports();
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (profile?.role !== 'commercial' && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Accès réservé aux commerciaux et administrateurs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rapports de Visite</h1>
          {profile?.role === 'commercial' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau rapport</span>
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nouveau rapport de visite</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.client_address}
                  onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.client_city}
                  onChange={(e) => setFormData({ ...formData, client_city: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{submitting ? 'Enregistrement...' : 'Enregistrer (avec GPS)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des rapports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">Aucun rapport de visite</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <h3 className="font-semibold text-lg">{report.client_name}</h3>
                  <p className="text-sm text-blue-100">{report.client_city}</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{report.client_address}</p>
                      <p>{report.client_city}</p>
                    </div>
                  </div>

                  {report.latitude && report.longitude && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <MapPin className="w-4 h-4" />
                      <span>GPS: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                    </div>
                  )}

                  {report.notes && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {report.notes}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(report.visit_date).toLocaleDateString('fr-FR')}</span>
                    <span>•</span>
                    <span>
                      {report.commercial.first_name} {report.commercial.last_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
