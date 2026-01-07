import { useState, useEffect } from 'react';
import { MessageCircle, Send, Users, User, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface GlobalMessage {
  id: string;
  sender_id: string;
  sender_role: string;
  target_role: string;
  message: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
  };
}

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
  };
  receiver: {
    first_name: string;
    last_name: string;
  };
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export default function AdminMessagesNew() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'private'>('global');
  const [globalMessages, setGlobalMessages] = useState<GlobalMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [newGlobalMessage, setNewGlobalMessage] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'buyer' | 'driver'>('all');
  const [newPrivateMessage, setNewPrivateMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadGlobalMessages();
    loadUsers();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadPrivateMessages(selectedUser);
    }
  }, [selectedUser]);

  const subscribeToMessages = () => {
    const globalChannel = supabase
      .channel('global-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_global' }, () => {
        loadGlobalMessages();
      })
      .subscribe();

    const privateChannel = supabase
      .channel('private-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_private' }, () => {
        if (selectedUser) {
          loadPrivateMessages(selectedUser);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
      supabase.removeChannel(privateChannel);
    };
  };

  const loadGlobalMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages_global')
        .select(`
          id,
          sender_id,
          sender_role,
          target_role,
          message,
          created_at,
          sender:profiles!messages_global_sender_id_fkey (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setGlobalMessages(data || []);
    } catch (error) {
      console.error('Error loading global messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrivateMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages_private')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          read_at,
          created_at,
          sender:profiles!messages_private_sender_id_fkey (first_name, last_name),
          receiver:profiles!messages_private_receiver_id_fkey (first_name, last_name)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPrivateMessages(data || []);

      await supabase
        .from('messages_private')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user?.id)
        .eq('sender_id', userId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error loading private messages:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .neq('id', user?.id)
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const sendGlobalMessage = async () => {
    if (!newGlobalMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages_global')
        .insert({
          sender_id: user.id,
          sender_role: 'admin',
          target_role: targetRole,
          message: newGlobalMessage.trim(),
        });

      if (error) throw error;

      setNewGlobalMessage('');
      await loadGlobalMessages();
    } catch (error) {
      console.error('Error sending global message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const sendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !selectedUser || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages_private')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser,
          message: newPrivateMessage.trim(),
        });

      if (error) throw error;

      setNewPrivateMessage('');
      await loadPrivateMessages(selectedUser);
    } catch (error) {
      console.error('Error sending private message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const getTargetBadge = (target: string) => {
    const config: Record<string, { label: string; className: string }> = {
      all: { label: 'Tous', className: 'bg-blue-100 text-blue-800' },
      buyer: { label: 'Clients', className: 'bg-green-100 text-green-800' },
      driver: { label: 'Chauffeurs', className: 'bg-purple-100 text-purple-800' },
    };

    const targetConfig = config[target] || config.all;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${targetConfig.className}`}>
        {targetConfig.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-red-100 text-red-800' },
      commercial: { label: 'Commercial', className: 'bg-blue-100 text-blue-800' },
      driver: { label: 'Chauffeur', className: 'bg-purple-100 text-purple-800' },
      buyer: { label: 'Client', className: 'bg-green-100 text-green-800' },
    };

    const roleConfig = config[role] || config.buyer;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleConfig.className}`}>
        {roleConfig.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messagerie Admin</h1>
          <p className="text-gray-600">Gestion des messages globaux et privés</p>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('global')}
                className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 ${
                  activeTab === 'global'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Megaphone className="w-5 h-5" />
                Messages Généraux
              </button>
              <button
                onClick={() => setActiveTab('private')}
                className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 ${
                  activeTab === 'private'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Messages Privés
              </button>
            </div>
          </div>

          {activeTab === 'global' ? (
            <div className="p-6">
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Envoyer un message à tous</h3>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataires
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTargetRole('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        targetRole === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setTargetRole('buyer')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        targetRole === 'buyer'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les clients
                    </button>
                    <button
                      onClick={() => setTargetRole('driver')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        targetRole === 'driver'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les chauffeurs
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGlobalMessage}
                    onChange={(e) => setNewGlobalMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && sendGlobalMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={sendGlobalMessage}
                    disabled={sending || !newGlobalMessage.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : globalMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Megaphone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun message global</p>
                  </div>
                ) : (
                  globalMessages.map((msg) => (
                    <div key={msg.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-100 p-2 rounded-full">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {msg.sender.first_name} {msg.sender.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        {getTargetBadge(msg.target_role)}
                      </div>
                      <p className="text-gray-700 mt-2">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-[700px]">
              <div className="w-1/3 border-r">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Utilisateurs</h3>
                </div>
                <div className="overflow-y-auto h-[calc(100%-61px)]">
                  {users.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucun utilisateur</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user.id)}
                        className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                          selectedUser === user.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {selectedUser ? (
                  <>
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-900">
                        {users.find(u => u.id === selectedUser)?.first_name}{' '}
                        {users.find(u => u.id === selectedUser)?.last_name}
                      </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {privateMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender_id === user?.id
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender_id === user?.id ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPrivateMessage}
                          onChange={(e) => setNewPrivateMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !sending && sendPrivateMessage()}
                          placeholder="Tapez votre message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={sendPrivateMessage}
                          disabled={sending || !newPrivateMessage.trim()}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Sélectionnez un utilisateur</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
