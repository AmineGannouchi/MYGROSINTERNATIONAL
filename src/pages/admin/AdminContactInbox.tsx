import { useState, useEffect } from 'react';
import { Mail, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminContactInbox() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id);

      loadMessages();
    } catch (error) {
      console.error('Error updating status:', error);
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
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages de contact</h1>

        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${
                    msg.status === 'new' ? 'bg-blue-100' :
                    msg.status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Mail className={`w-6 h-6 ${
                      msg.status === 'new' ? 'text-blue-600' :
                      msg.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{msg.subject}</h3>
                    <p className="text-sm text-gray-600">
                      De: {msg.name} ({msg.email})
                      {msg.phone && ` - ${msg.phone}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <select
                  value={msg.status}
                  onChange={(e) => updateStatus(msg.id, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="new">Nouveau</option>
                  <option value="in_progress">En cours</option>
                  <option value="closed">Clôturé</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              Aucun message de contact
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
