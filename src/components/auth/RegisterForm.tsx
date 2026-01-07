import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface RegisterFormProps {
  onToggle: () => void;
  onSuccess?: () => void;
}

export default function RegisterForm({ onToggle, onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'client' | 'member'>('client');
  const [requestedRole, setRequestedRole] = useState<'driver' | 'admin'>('driver');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'buyer',
      });

      if (accountType === 'member') {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const { error: accessRequestError } = await supabase
            .from('access_requests')
            .insert({
              user_id: sessionData.session.user.id,
              requested_role: requestedRole,
              reason: reason || null,
            });

          if (accessRequestError) {
            console.error('Error creating access request:', accessRequestError);
          }
        }
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de compte
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
              accountType === 'client'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="accountType"
                value="client"
                checked={accountType === 'client'}
                onChange={(e) => setAccountType(e.target.value as 'client' | 'member')}
                className="sr-only"
              />
              <div className="text-center">
                <p className="font-semibold text-gray-900">Client</p>
                <p className="text-xs text-gray-600 mt-1">Accès immédiat</p>
              </div>
            </label>

            <label className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
              accountType === 'member'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="accountType"
                value="member"
                checked={accountType === 'member'}
                onChange={(e) => setAccountType(e.target.value as 'client' | 'member')}
                className="sr-only"
              />
              <div className="text-center">
                <p className="font-semibold text-gray-900">Membre entreprise</p>
                <p className="text-xs text-gray-600 mt-1">Sur validation</p>
              </div>
            </label>
          </div>
        </div>

        {accountType === 'member' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle demandé
            </label>
            <select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as 'driver' | 'admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="driver">Chauffeur</option>
              <option value="admin">Admin</option>
            </select>

            <div className="mt-3">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Raison de la demande (optionnel)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Pourquoi souhaitez-vous ce rôle ?"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={onToggle}
          className="text-sm text-green-600 hover:text-green-700"
        >
          Déjà un compte ? Se connecter
        </button>
      </div>
    </div>
  );
}
