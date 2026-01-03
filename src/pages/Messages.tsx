import { useState, useEffect } from 'react';
import { MessageCircle, Send, Paperclip, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Conversation {
  id: string;
  type: string;
  subject: string;
  updated_at: string;
  participants: Array<{
    user_id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  }>;
  messages: Array<{
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    read: boolean;
  }>;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  sender: {
    first_name: string;
    last_name: string;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversation:conversations (
            id,
            type,
            subject,
            updated_at
          )
        `)
        .eq('user_id', user?.id);

      if (partError) throw partError;

      const conversationIds = participations?.map(p => p.conversation_id) || [];

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: convos, error: convoError } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          subject,
          updated_at,
          participants:conversation_participants (
            user_id,
            user:profiles!conversation_participants_user_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convoError) throw convoError;

      setConversations(convos || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          read,
          sender:profiles!messages_sender_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const other = conversation.participants?.find(p => p.user_id !== user?.id);
    if (other?.user) {
      return `${other.user.first_name} ${other.user.last_name}`;
    }
    return 'Conversation';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messagerie</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full">
            <div className="w-1/3 border-r">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
              </div>

              <div className="overflow-y-auto" style={{ height: 'calc(100% - 73px)' }}>
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Chargement...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucune conversation</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.id ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {getOtherParticipant(conversation)}
                          </h3>
                          {conversation.subject && (
                            <p className="text-sm text-gray-600 truncate">{conversation.subject}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          conversation.type === 'internal' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {conversation.type === 'internal' ? 'Interne' : 'B2B'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-900">
                      {getOtherParticipant(
                        conversations.find(c => c.id === selectedConversation) as Conversation
                      )}
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 146px)' }}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.sender_id !== user?.id && (
                            <p className="text-xs font-semibold mb-1">
                              {message.sender.first_name} {message.sender.last_name}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user?.id ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-200 rounded-full">
                        <Paperclip className="w-5 h-5 text-gray-600" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                        placeholder="Tapez votre message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p>Sélectionnez une conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
