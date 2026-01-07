import { useState, useEffect } from 'react';
import { MessageCircle, Send, Megaphone, User } from 'lucide-react';
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

export default function ClientMessages() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, []);

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-client')
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
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToAdmin = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          sender_role: profile?.role || 'buyer',
          message: newMessage.trim(),
          is_broadcast: false,
          target_role: null,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messagerie</h1>
          <p className="text-gray-600">Messages broadcast et conversation avec l'admin</p>
        </div>

        <div className="bg-white rounded-lg shadow-md h-[700px] flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-full">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Messagerie MYGROS INTERNATIONAL</p>
                <p className="text-xs text-gray-500">Messages de l'équipe et chat avec l'admin</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Aucun message pour le moment</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isFromMe = msg.sender_id === user?.id;
                const isBroadcast = msg.is_broadcast;

                if (isBroadcast) {
                  return (
                    <div key={msg.id} className="border border-blue-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Megaphone className="w-4 h-4 text-blue-600" />
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
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isFromMe
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!isFromMe && (
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-3 h-3" />
                          <p className="text-xs font-semibold">
                            {msg.sender.first_name} {msg.sender.last_name}
                          </p>
                        </div>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        isFromMe ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessageToAdmin()}
                placeholder="Répondre à l'admin..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={sendMessageToAdmin}
                disabled={sending || !newMessage.trim()}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
