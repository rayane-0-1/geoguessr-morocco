import { useState, useEffect } from "react";
import { City, Monument, QuizQuestion, ScoreBoardEntry } from "../types";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, getDoc, getDocFromServer, serverTimestamp } from "firebase/firestore";

export function useGameData() {
  const [cities, setCities] = useState<City[]>([]);
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreBoardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is reporting as offline.");
          setError("Network error: Firebase client is offline. Check your connectivity.");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    // Basic static data fetch
    const fetchStaticData = async () => {
      try {
        const [citiesRes, monumentsRes, quizRes] = await Promise.all([
          fetch("/api/data/cities"),
          fetch("/api/data/monuments"),
          fetch("/api/data/quiz")
        ]);
        
        const [citiesArr, monArr, quizArr] = await Promise.all([
          citiesRes.json(),
          monumentsRes.json(),
          quizRes.json()
        ]);
        setCities(citiesArr);
        setMonuments(monArr);
        setQuiz(quizArr);
      } catch (err) {
        console.error("Static data fetch failed:", err);
      }
    };
    fetchStaticData();
  }, []);

  useEffect(() => {
    // Real-time Firestore Leaderboard
    const q = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries: ScoreBoardEntry[] = [];
      snapshot.forEach((doc) => {
        entries.push(doc.data() as ScoreBoardEntry);
      });
      setLeaderboard(entries);
      setLoading(false);
    }, (err) => {
      console.error("Leaderboard subscribe failed:", err);
      setError("Ranking data unavailable");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const submitScore = async (username: string, score: number, userId: string, photoURL?: string | null) => {
    if (!userId) return;
    
    try {
      const userRef = doc(db, "leaderboard", userId);
      const userDoc = await getDoc(userRef);
      
      let currentBest = 0;
      let gamesPlayed = 0;
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        currentBest = data.score || 0;
        gamesPlayed = data.gamesPlayed || 0;
      }

      // Update only if it's a new high score
      if (score > currentBest || !userDoc.exists()) {
        await setDoc(userRef, {
          userId,
          name: username, // Mapping name to ScoreBoardEntry field
          username, // Also keeping for consistency with blueprint
          score: Math.max(score, currentBest),
          gamesPlayed: gamesPlayed + 1,
          lastUpdated: Date.now(),
          date: new Date().toISOString(),
          photoURL: photoURL || null
        }, { merge: true });
      } else {
        // Just update games played if not a high score
        await setDoc(userRef, {
          gamesPlayed: gamesPlayed + 1,
          lastUpdated: Date.now()
        }, { merge: true });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Score submission failed:", errorMsg);
      if (errorMsg.includes("offline")) {
        setError("Critical: Synchronization failed. Remote database is unreachable.");
      }
    }
  };

  return { cities, monuments, quiz, leaderboard, loading, error, submitScore };
}
