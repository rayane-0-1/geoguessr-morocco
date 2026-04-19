import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, Lock, Terminal, Fingerprint, ChevronRight } from "lucide-react";
import { auth, googleProvider } from "../../lib/firebase";
import { signInWithPopup } from "firebase/auth";

export const LoginView: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      // Auth state change will handle navigation in App.tsx
    } catch (err) {
      console.error("Auth error:", err);
      setError("AUTHENTICATION_FAILED: ACCESS_DENIED");
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-bg-deep flex items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="scanline" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl group"
      >
        <div className="hud-bracket hud-bracket-tl" />
        <div className="hud-bracket hud-bracket-tr" />
        <div className="hud-bracket hud-bracket-bl" />
        <div className="hud-bracket hud-bracket-br" />

        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold relative">
            {isVerifying ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Lock size={32} />
              </motion.div>
            ) : (
              <Fingerprint size={32} />
            )}
            <div className="absolute -inset-2 border border-accent-gold/20 rounded-2xl animate-pulse" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-display font-bold text-text-main tracking-tight group-hover:text-accent-gold transition-colors duration-500">
              IDENTITY VERIFICATION
            </h1>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.3em]">
              Central Moroccan Intelligence Console
            </p>
          </div>

          <div className="w-full flex flex-col gap-6 mt-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg text-rose-500 text-[10px] font-mono tracking-widest text-center animate-pulse">
                {error}
              </div>
            )}
            
            <button 
              onClick={handleGoogleLogin}
              disabled={isVerifying}
              className="btn-tactical btn-tactical-gold hover-shine w-full py-5 rounded-2xl"
            >
              <div className="flex items-center justify-center gap-2">
                {isVerifying ? (
                  <>
                    <span className="animate-pulse tracking-widest text-xs uppercase">ENCRYPTING...</span>
                  </>
                ) : (
                  <>
                    <img 
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                      alt="Google" 
                      className="w-4 h-4 mr-2"
                      referrerPolicy="no-referrer"
                    />
                    <span className="tracking-widest text-xs uppercase text-bg-deep font-bold">AUTHORIZE WITH GOOGLE</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </div>
            </button>

            <p className="text-[9px] text-text-muted text-center uppercase tracking-widest opacity-60">
              Sign in to sync discovery progress & global rankings
            </p>
          </div>

          <div className="flex justify-between w-full mt-4 border-t border-white/5 pt-4 opacity-40">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[7px] font-mono uppercase tracking-widest text-text-muted">Protocol</span>
              <span className="text-[8px] font-mono text-text-main">SSL-RSA-2048</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[7px] font-mono uppercase tracking-widest text-text-muted">Terminal</span>
              <span className="text-[8px] font-mono text-text-main">LOC-MA-88</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security Overlay for verification */}
      {isVerifying && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm z-[110] flex flex-col items-center justify-center gap-4"
        >
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2 }}
              className="absolute inset-y-0 left-0 bg-accent-gold shadow-[0_0_15px_#d4af37]"
            />
          </div>
          <motion.p 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-[10px] font-mono text-accent-gold uppercase tracking-[0.5em]"
          >
            Verifying Credentials
          </motion.p>
        </motion.div>
      )}
    </div>
  );
};
