import { useState, useEffect } from 'react';
import { MessageCircle, Send, Users, Megaphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  is_broadcast: boolean;
  target_role: string | null;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
  };
}

export default function AdminMessagesNew() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'buyer' | 'driver'>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, []);

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          loadMessages();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          sender_role,
          message,
          is_broadcast,
          target_role,
          created_at,
          sender:profiles!messages_sender_id_fkey (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcastMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          sender_role: profile?.role || 'admin',
          message: newMessage.trim(),
          is_broadcast: true,
          target_role: targetRole,
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const getTargetBadge = (target: string | null) => {
    const config: Record<string, { label: string; className: string }> = {
      all: { label: 'Tous', className: 'bg-blue-100 text-blue-800' },
      buyer: { label: 'Clients', className: 'bg-green-100 text-green-800' },
      driver: { label: 'Chauffeurs', className: 'bg-orange-100 text-orange-800' },
    };

    const targetConfig = config[target || 'all'] || config.all;
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
      driver: { label: 'Chauffeur', className: 'bg-orange-100 text-orange-800' },
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
          <p className="text-gray-600">Envoi de messages broadcast à tous les utilisateurs</p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <Megaphone className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Envoyer un message broadcast</h3>
              </div>

              <div className="mb-4">
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
                    <Users className="w-4 h-4 inline mr-2" />
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
                    <Users className="w-4 h-4 inline mr-2" />
                    Tous les clients
                  </button>
                  <button
                    onClick={() => setTargetRole('driver')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      targetRole === 'driver'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Tous les chauffeurs
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sending && sendBroadcastMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={sendBroadcastMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des messages</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucun message</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`${msg.sender_role === 'admin' ? 'bg-red-100' : 'bg-green-100'} p-2 rounded-full`}>
                          {msg.is_broadcast ? (
                            <Megaphone className={`w-4 h-4 ${msg.sender_role === 'admin' ? 'text-red-600' : 'text-green-600'}`} />
                          ) : (
                            <MessageCircle className={`w-4 h-4 ${msg.sender_role === 'admin' ? 'text-red-600' : 'text-green-600'}`} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {msg.sender.first_name} {msg.sender.last_name}
                            </p>
                            {getRoleBadge(msg.sender_role)}
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(msg.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      {msg.is_broadcast && getTargetBadge(msg.target_role)}
                    </div>
                    <p className="text-gray-700 mt-2">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
