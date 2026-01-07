import { useState, useEffect } from 'react';
import { Users, UserCheck, Truck, ShieldCheck, Clock, Mail, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company_id: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [assigningRole, setAssigningRole] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, first_name, last_name, phone, company_id, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      const usersWithAuth = profiles?.map(profile => {
        const authUser = authUsers.users.find(u => u.id === profile.id);
        return {
          ...profile,
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      }) || [];

      setUsers(usersWithAuth);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setAssigningRole(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erreur lors de la mise à jour du rôle');
    } finally {
      setAssigningRole(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string; icon: any }> = {
      admin: { label: 'Admin', className: 'bg-red-100 text-red-800', icon: ShieldCheck },
      commercial: { label: 'Commercial', className: 'bg-blue-100 text-blue-800', icon: UserCheck },
      driver: { label: 'Chauffeur', className: 'bg-purple-100 text-purple-800', icon: Truck },
      buyer: { label: 'Client', className: 'bg-green-100 text-green-800', icon: Users },
    };

    const config = roleConfig[role] || roleConfig.buyer;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    commercial: users.filter(u => u.role === 'commercial').length,
    driver: users.filter(u => u.role === 'driver').length,
    buyer: users.filter(u => u.role === 'buyer').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Liste et assignation des rôles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`bg-white rounded-lg shadow-md p-4 text-left transition-all ${
              filter === 'all' ? 'ring-2 ring-green-600' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter('admin')}
            className={`bg-white rounded-lg shadow-md p-4 text-left transition-all ${
              filter === 'admin' ? 'ring-2 ring-red-600' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="bg-red-100 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Admins</p>
            <p className="text-2xl font-bold text-gray-900">{stats.admin}</p>
          </button>

          <button
            onClick={() => setFilter('commercial')}
            className={`bg-white rounded-lg shadow-md p-4 text-left transition-all ${
              filter === 'commercial' ? 'ring-2 ring-blue-600' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Commerciaux</p>
            <p className="text-2xl font-bold text-gray-900">{stats.commercial}</p>
          </button>

          <button
            onClick={() => setFilter('driver')}
            className={`bg-white rounded-lg shadow-md p-4 text-left transition-all ${
              filter === 'driver' ? 'ring-2 ring-purple-600' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Truck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Chauffeurs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.driver}</p>
          </button>

          <button
            onClick={() => setFilter('buyer')}
            className={`bg-white rounded-lg shadow-md p-4 text-left transition-all ${
              filter === 'buyer' ? 'ring-2 ring-green-600' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">Clients</p>
            <p className="text-2xl font-bold text-gray-900">{stats.buyer}</p>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">
                {filter === 'all' ? 'Tous les utilisateurs' : `Filtre: ${filter}`}
              </h2>
              <span className="text-sm text-gray-500">({filteredUsers.length})</span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle actuel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière connexion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.last_sign_in_at ? (
                          <div className="text-sm text-gray-900">
                            <p>{new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(user.last_sign_in_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Jamais connecté
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          disabled={assigningRole === user.id}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <option value="buyer">Client</option>
                          <option value="driver">Chauffeur</option>
                          <option value="commercial">Commercial</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
