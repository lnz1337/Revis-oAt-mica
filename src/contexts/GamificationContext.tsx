import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BadgeDefinition, BADGE_DEFINITIONS, BadgeType } from '../lib/gamificationService';

type NotificationType = 'badge' | 'points' | 'streak';

interface GamificationNotification {
    id: string;
    type: NotificationType;
    data: any;
}

interface GamificationContextType {
    showBadge: (badgeType: BadgeType) => void;
    showPoints: (amount: number, reason: string) => void;
    showStreak: (days: number) => void;
    currentNotification: GamificationNotification | null;
    dismissNotification: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// Sons de efeito (URLs públicas para teste)
const SOUNDS = {
    badge: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Win sound
    points: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Coin sound
    streak: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Fire sound
};

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [queue, setQueue] = useState<GamificationNotification[]>([]);
    const [currentNotification, setCurrentNotification] = useState<GamificationNotification | null>(null);

    const playSound = (type: NotificationType) => {
        try {
            const audio = new Audio(SOUNDS[type]);
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed (user interaction needed):', e));
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    };

    const addToQueue = (type: NotificationType, data: any) => {
        const id = Math.random().toString(36).substring(7);
        setQueue(prev => [...prev, { id, type, data }]);
    };

    const showBadge = useCallback((badgeType: BadgeType) => {
        addToQueue('badge', BADGE_DEFINITIONS[badgeType]);
    }, []);

    const showPoints = useCallback((amount: number, reason: string) => {
        addToQueue('points', { amount, reason });
    }, []);

    const showStreak = useCallback((days: number) => {
        addToQueue('streak', { days });
    }, []);

    const dismissNotification = useCallback(() => {
        setCurrentNotification(null);
    }, []);

    // Processar fila
    useEffect(() => {
        if (!currentNotification && queue.length > 0) {
            const next = queue[0];
            setQueue(prev => prev.slice(1));
            setCurrentNotification(next);
            playSound(next.type);

            // Auto dismiss para pontos (rápido)
            if (next.type === 'points') {
                setTimeout(() => {
                    setCurrentNotification(null);
                }, 3000);
            }
        }
    }, [currentNotification, queue]);

    return (
        <GamificationContext.Provider value={{
            showBadge,
            showPoints,
            showStreak,
            currentNotification,
            dismissNotification
        }}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
}
