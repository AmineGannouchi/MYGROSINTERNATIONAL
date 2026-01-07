import { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b flex items-center justify-between p-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'login' ? 'Connexion' : 'Inscription'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-6 font-semibold transition-colors ${
                activeTab === 'login'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-6 font-semibold transition-colors ${
                activeTab === 'register'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inscription
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'login' ? (
            <LoginForm onToggle={() => setActiveTab('register')} onSuccess={onClose} />
          ) : (
            <RegisterForm onToggle={() => setActiveTab('login')} onSuccess={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
