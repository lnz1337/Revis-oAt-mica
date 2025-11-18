import { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import { BADGE_DEFINITIONS, BadgeType } from '../lib/gamificationService';

interface BadgeNotificationProps {
  badgeType: BadgeType;
  onClose: () => void;
}

export function BadgeNotification({ badgeType, onClose }: BadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const badge = BADGE_DEFINITIONS[badgeType];

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!badge) return null;

  return (
    <div
      className={`fixed top-16 sm:top-20 right-2 sm:right-4 left-2 sm:left-auto z-50 transition-all duration-300 max-w-sm sm:max-w-sm mx-auto sm:mx-0 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-2xl p-4 sm:p-6 border-2 border-white">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="text-4xl sm:text-5xl flex-shrink-0">{badge.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-white">Badge Conquistado!</h3>
            </div>
            <p className="text-white font-semibold mb-1 text-sm sm:text-base break-words">{badge.name}</p>
            <p className="text-purple-100 text-xs sm:text-sm break-words">{badge.description}</p>
            <div className="mt-2 sm:mt-3 bg-white bg-opacity-20 rounded-lg px-2 sm:px-3 py-1 inline-block">
              <p className="text-yellow-300 text-xs sm:text-sm font-semibold">+50 pontos</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:text-yellow-200 transition-colors flex-shrink-0 p-1 touch-manipulation"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

