import { useEffect, useState } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import { Trophy, Star, Flame, X } from 'lucide-react';

export function BadgeNotification() {
  const { currentNotification, dismissNotification } = useGamification();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentNotification) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentNotification]);

  if (!currentNotification) return null;

  const { type, data } = currentNotification;

  if (type === 'badge') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <div className="relative bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center transform animate-bounce-in pointer-events-auto border-4 border-yellow-400">
          <button
            onClick={dismissNotification}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-yellow-200 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="text-8xl relative z-10 animate-spin-slow">
              {data.icon}
            </div>
          </div>

          <h3 className="text-yellow-600 font-bold text-lg uppercase tracking-wider mb-2">
            Nova Conquista!
          </h3>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {data.name}
          </h2>
          <p className="text-gray-600 mb-6">
            {data.description}
          </p>

          <button
            onClick={dismissNotification}
            className="bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-yellow-600 transition-transform hover:scale-105 active:scale-95"
          >
            Incrível!
          </button>
        </div>
      </div>
    );
  }

  if (type === 'streak') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <div className="relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center transform animate-bounce-in pointer-events-auto text-white">
          <button
            onClick={dismissNotification}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mb-6">
            <Flame className="w-24 h-24 mx-auto animate-pulse text-yellow-300" />
          </div>

          <h2 className="text-4xl font-extrabold mb-2">
            {data.days} Dias!
          </h2>
          <p className="text-orange-100 text-lg mb-6">
            Sequência insana! Continue assim!
          </p>

          <button
            onClick={dismissNotification}
            className="bg-white text-orange-600 px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-orange-50 transition-transform hover:scale-105 active:scale-95"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Points toast
  return (
    <div className="fixed top-20 right-4 z-[100] animate-slide-in-right">
      <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-xl p-4 flex items-center gap-4 min-w-[300px]">
        <div className="bg-green-100 p-2 rounded-full">
          <Star className="w-6 h-6 text-green-600 fill-green-600" />
        </div>
        <div>
          <p className="font-bold text-gray-800 text-lg">+{data.amount} Pontos</p>
          <p className="text-sm text-gray-600">{data.reason}</p>
        </div>
      </div>
    </div>
  );
}
