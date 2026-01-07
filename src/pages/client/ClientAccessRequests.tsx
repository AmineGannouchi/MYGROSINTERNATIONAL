import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AccessRequest {
  id: string;
  requested_role: string;
  status: string;
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function ClientAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [requestedRole, setRequestedRole] = useState<'driver' | 'admin'>('driver');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('access_requests').insert({
        user_id: user.id,
        requested_role: requestedRole,
        reason: reason || null,
      });

      if (error) throw error;

      setShowForm(false);
      setReason('');
      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Erreur lors de la création de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes demandes d'accès</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Nouvelle demande
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Nouvelle demande</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle demandé
                </label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value as 'driver' | 'admin')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="driver">Chauffeur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de la demande (optionnel)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Expliquez pourquoi vous avez besoin de ce rôle..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Envoyer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 capitalize">
                    {request.requested_role}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  {request.status === 'pending' && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      <Clock className="w-4 h-4" />
                      En attente
                    </span>
                  )}
                  {request.status === 'approved' && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Approuvé
                    </span>
                  )}
                  {request.status === 'rejected' && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                      <XCircle className="w-4 h-4" />
                      Rejeté
                    </span>
                  )}
                </div>
              </div>

              {request.reason && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{request.reason}</p>
                </div>
              )}

              {request.reviewed_at && (
                <p className="text-xs text-gray-500 mt-3">
                  Traité le {new Date(request.reviewed_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ))}

          {requests.length === 0 && !showForm && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              <p>Aucune demande d'accès</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                Créer une première demande
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
