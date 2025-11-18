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
      className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-2xl p-6 max-w-sm border-2 border-white">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{badge.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold text-white">Badge Conquistado!</h3>
            </div>
            <p className="text-white font-semibold mb-1">{badge.name}</p>
            <p className="text-purple-100 text-sm">{badge.description}</p>
            <div className="mt-3 bg-white bg-opacity-20 rounded-lg px-3 py-1 inline-block">
              <p className="text-yellow-300 text-sm font-semibold">+50 pontos</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:text-yellow-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

