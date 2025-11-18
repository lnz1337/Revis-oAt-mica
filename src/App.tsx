import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { StudySessionForm } from './components/StudySessionForm';
import { ScheduledReviewsView } from './components/ScheduledReviewsView';
import { ThemeHistory } from './components/ThemeHistory';
import { StudyContentManager } from './components/StudyContentManager';
import { GamificationDashboard } from './components/GamificationDashboard';
import { LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showReviewsView, setShowReviewsView] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [contentTheme, setContentTheme] = useState<string | null>(null);
  const [showGamification, setShowGamification] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => setUser(true)} />;
  }

  return (
    <div className="relative">
      <button
        onClick={handleSignOut}
        className="fixed top-2 sm:top-4 right-2 sm:right-4 z-40 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-md flex items-center gap-1.5 sm:gap-2 border border-gray-200 text-xs sm:text-sm touch-manipulation"
        aria-label="Sair"
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Sair</span>
      </button>

      <Dashboard
        key={refreshKey}
        onNewSession={() => setShowSessionForm(true)}
        onViewReviews={() => setShowReviewsView(true)}
        onViewHistory={(theme) => setSelectedTheme(theme)}
        onViewContent={(theme) => setContentTheme(theme)}
        onViewGamification={() => setShowGamification(true)}
      />

      {showSessionForm && (
        <StudySessionForm
          onClose={() => setShowSessionForm(false)}
          onSuccess={() => {
            setShowSessionForm(false);
            handleRefresh();
          }}
        />
      )}

      {showReviewsView && (
        <ScheduledReviewsView
          onClose={() => setShowReviewsView(false)}
          onRefresh={handleRefresh}
          onViewContent={(theme) => {
            setShowReviewsView(false);
            setContentTheme(theme);
          }}
        />
      )}

      {selectedTheme && (
        <ThemeHistory
          theme={selectedTheme}
          onClose={() => setSelectedTheme(null)}
          onViewContent={(theme) => {
            setSelectedTheme(null);
            setContentTheme(theme);
          }}
        />
      )}

      {contentTheme && (
        <StudyContentManager
          theme={contentTheme}
          onClose={() => setContentTheme(null)}
        />
      )}

      {showGamification && (
        <GamificationDashboard
          onClose={() => setShowGamification(false)}
        />
      )}
    </div>
  );
}

export default App;
