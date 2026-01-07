import { useState, useEffect } from 'react';
import { MessageCircle, Send, Megaphone, User } from 'lucide-react';
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
}

export default function DriverMessages() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'private'>('global');
  const [globalMessages, setGlobalMessages] = useState<GlobalMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  const [newPrivateMessage, setNewPrivateMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadGlobalMessages();
    loadAdminUsers();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    if (adminUsers.length > 0) {
      loadPrivateMessages();
    }
  }, [adminUsers]);

  const subscribeToMessages = () => {
    const globalChannel = supabase
      .channel('global-messages-driver')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_global' }, () => {
        loadGlobalMessages();
      })
      .subscribe();

    const privateChannel = supabase
      .channel('private-messages-driver')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_private' }, () => {
        loadPrivateMessages();
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
        .limit(50);

      if (error) throw error;
      setGlobalMessages(data || []);
    } catch (error) {
      console.error('Error loading global messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['admin', 'commercial']);

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const loadPrivateMessages = async () => {
    if (adminUsers.length === 0) return;

    try {
      const adminIds = adminUsers.map(a => a.id);

      const { data, error } = await supabase
        .from('messages_private')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          read_at,
          created_at,
          sender:profiles!messages_private_sender_id_fkey (first_name, last_name)
        `)
        .or(`and(sender_id.eq.${user?.id},receiver_id.in.(${adminIds.join(',')})),and(receiver_id.eq.${user?.id},sender_id.in.(${adminIds.join(',')}))`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPrivateMessages(data || []);

      await supabase
        .from('messages_private')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user?.id)
        .is('read_at', null);
    } catch (error) {
      console.error('Error loading private messages:', error);
    }
  };

  const sendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !user || adminUsers.length === 0) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages_private')
        .insert({
          sender_id: user.id,
          receiver_id: adminUsers[0].id,
          message: newPrivateMessage.trim(),
        });

      if (error) throw error;

      setNewPrivateMessage('');
      await loadPrivateMessages();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messagerie</h1>
          <p className="text-gray-600">Messages de l'équipe et chat avec l'admin</p>
        </div>

        <div className="bg-white rounded-lg shadow-md">
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
                Messages de l'équipe
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
                Chat avec l'admin
              </button>
            </div>
          </div>

          {activeTab === 'global' ? (
            <div className="p-6">
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : globalMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucun message pour le moment</p>
                  </div>
                ) : (
                  globalMessages.map((msg) => (
                    <div key={msg.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <User className="w-4 h-4 text-purple-600" />
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
            <div className="h-[700px] flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 p-2 rounded-full">
                    <User className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Administration</p>
                    <p className="text-xs text-gray-500">Équipe MYGROS INTERNATIONAL</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {privateMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucun message. Commencez la conversation!</p>
                  </div>
                ) : (
                  privateMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_id === user?.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {msg.sender_id !== user?.id && (
                          <p className="text-xs font-semibold mb-1">
                            {msg.sender.first_name} {msg.sender.last_name}
                          </p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === user?.id ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPrivateMessage}
                    onChange={(e) => setNewPrivateMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && sendPrivateMessage()}
                    placeholder="Tapez votre message à l'admin..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={sendPrivateMessage}
                    disabled={sending || !newPrivateMessage.trim()}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
