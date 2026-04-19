import { useState, useCallback, useEffect } from "react";
import { Layout } from "./components/common/Layout.tsx";
import { LandingView } from "./components/common/LandingView.tsx";
import { ExplorationMode } from "./components/game/ExplorationMode.tsx";
import { QuizEngine } from "./components/game/QuizEngine.tsx";
import { DefiMode } from "./components/game/DefiMode.tsx";
import { Leaderboard } from "./components/game/Leaderboard.tsx";
import { LoginView } from "./components/game/LoginView.tsx";
import { useGameData } from "./hooks/useGameData.ts";
import { GameMode, GameState, Monument, City, UserProfile } from "./types.ts";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";

export default function App() {
  const { cities, monuments, quiz, leaderboard, loading: dataLoading, error, submitScore } = useGameData();
  const [authLoading, setAuthLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    mode: "login",
    score: 0,
    unlockedMonuments: [],
    completedQuiz: false,
    currentUser: null,
    lang: "en"
  });
  const [searchTarget, setSearchTarget] = useState<Monument | City | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // User location tracking
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation access denied or failed", error);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Sync RTL based on language
  useEffect(() => {
    document.documentElement.dir = gameState.lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = gameState.lang;
  }, [gameState.lang]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };
        
        const savedScore = localStorage.getItem(`score_${user.uid}`);
        const savedMonuments = localStorage.getItem(`monuments_${user.uid}`);

        setGameState(prev => ({ 
          ...prev, 
          currentUser: profile,
          score: savedScore ? parseInt(savedScore) : 0,
          unlockedMonuments: savedMonuments ? JSON.parse(savedMonuments) : [],
          mode: prev.mode === "login" ? "idle" : prev.mode
        }));
      } else {
        setGameState(prev => ({ ...prev, currentUser: null, mode: "login" }));
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Persist score and monuments when they change
  useEffect(() => {
    if (gameState.currentUser) {
      localStorage.setItem(`score_${gameState.currentUser.uid}`, gameState.score.toString());
      localStorage.setItem(`monuments_${gameState.currentUser.uid}`, JSON.stringify(gameState.unlockedMonuments));
    }
  }, [gameState.score, gameState.unlockedMonuments, gameState.currentUser]);

  const toggleLanguage = useCallback(() => {
    setGameState(prev => ({ ...prev, lang: prev.lang === "ar" ? "en" : "ar" }));
  }, []);

  const handleModeChange = useCallback((mode: GameMode) => {
    setGameState(prev => ({ ...prev, mode }));
    setSearchTarget(null); // Reset search when mode changes
  }, []);

  const handleSearchSelect = useCallback((item: Monument | City) => {
    if (gameState.mode !== "exploration") {
      setGameState(prev => ({ ...prev, mode: "exploration" }));
    }
    setSearchTarget(item);
  }, [gameState.mode]);

  const handleCompleteDefi = useCallback((bonus: number) => {
    const finalScore = gameState.score + bonus;
    setGameState(prev => ({
      ...prev,
      score: finalScore,
      mode: "idle"
    }));
    
    if (gameState.currentUser) {
      submitScore(
        gameState.currentUser.displayName || "Unknown Operator", 
        finalScore, 
        gameState.currentUser.uid,
        gameState.currentUser.photoURL
      );
    }
  }, [gameState.score, gameState.currentUser, submitScore]);

  const handleCompleteQuiz = useCallback((bonus: number) => {
    const finalScore = gameState.score + bonus;
    setGameState(prev => ({
      ...prev,
      score: finalScore,
      mode: "idle"
    }));

    if (gameState.currentUser) {
      submitScore(
        gameState.currentUser.displayName || "Unknown Operator", 
        finalScore, 
        gameState.currentUser.uid,
        gameState.currentUser.photoURL
      );
    }
  }, [gameState.score, gameState.currentUser, submitScore]);

  const handleMonumentUnlocked = useCallback((id: string, bonus: number) => {
    setGameState(prev => {
      const newScore = prev.score + bonus;
      if (prev.currentUser) {
        submitScore(
          prev.currentUser.displayName || "Unknown Operator",
          newScore,
          prev.currentUser.uid,
          prev.currentUser.photoURL
        );
      }
      return {
        ...prev,
        score: newScore,
        unlockedMonuments: [...prev.unlockedMonuments, id]
      };
    });
  }, [submitScore]);

  if (dataLoading || authLoading) {
    return (
      <div className="h-screen w-full bg-bg-deep flex flex-col items-center justify-center text-text-main font-sans">
        <Loader2 className="animate-spin text-accent-gold mb-6" size={48} />
        <span className="text-[10px] tracking-[0.4em] font-bold uppercase text-accent-gold/60 font-mono">
          Initializing Digital Heritage Interface
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-bg-deep flex flex-col items-center justify-center text-text-main p-8 text-center">
        <h1 className="text-rose-500 font-serif text-3xl mb-4 uppercase tracking-widest font-bold italic">System Error</h1>
        <p className="text-text-muted font-mono text-sm max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-10 px-8 py-3 bg-accent-gold text-bg-deep text-[10px] font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-colors"
        >
          Attempt Re-Initialization
        </button>
      </div>
    );
  }

  return (
    <Layout 
      activeMode={gameState.mode} 
      onModeChange={handleModeChange} 
      score={gameState.score}
      monuments={monuments}
      cities={cities}
      onSearchSelect={handleSearchSelect}
      lang={gameState.lang}
      onToggleLang={toggleLanguage}
      user={gameState.currentUser}
    >
      {gameState.mode === "idle" && (
        <LandingView onStart={handleModeChange} unlockedCount={gameState.unlockedMonuments.length} lang={gameState.lang} />
      )}
      
      {gameState.mode === "exploration" && (
        <ExplorationMode 
          monuments={monuments} 
          cities={cities} 
          onExplored={handleMonumentUnlocked}
          unlockedList={gameState.unlockedMonuments}
          externalTarget={searchTarget}
          lang={gameState.lang}
          userLocation={userLocation}
        />
      )}

      {gameState.mode === "quiz" && (
        <QuizEngine 
          monuments={monuments}
          cities={cities}
          onComplete={handleCompleteQuiz} 
          onExit={() => handleModeChange("idle")} 
          lang={gameState.lang}
        />
      )}

      {gameState.mode === "defi" && (
        <DefiMode 
          monuments={monuments} 
          onComplete={handleCompleteDefi} 
          onExit={() => handleModeChange("idle")} 
          lang={gameState.lang}
        />
      )}

      {gameState.mode === "leaderboard" && (
        <Leaderboard entries={leaderboard} user={gameState.currentUser} lang={gameState.lang} />
      )}

      {gameState.mode === "login" && (
        <LoginView />
      )}
    </Layout>
  );
}
