import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="text-center animate-fade-in">
        <div className="mb-6 transform hover:scale-110 transition-transform duration-300">
          <img
            src="/logo-nv-mygros.png"
            alt="MYGROS INTERNATIONAL"
            className="h-32 w-32 mx-auto object-contain drop-shadow-2xl"
          />
        </div>
        <h1 className="text-4xl font-bold text-green-700 mb-2">MYGROS INTERNATIONAL</h1>
        <p className="text-gray-600 text-lg">Grossiste spécialiste des saveurs méditerranéennes</p>
        <div className="mt-8">
          <div className="w-16 h-1 bg-green-600 mx-auto rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
