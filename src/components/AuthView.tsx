import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  UserPlus,
  LogIn
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { 
  signUpWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  isFirebaseConfigured, 
  saveUserSession, 
  syncMarketingLead 
} from '../lib/firebase';
import { toast } from 'sonner';

interface AuthViewProps {
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; isLogin?: boolean }) => void;
}

type AuthMode = 'signin' | 'signup';

export const AuthView: React.FC<AuthViewProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !name)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        let user;
        if (mode === 'signup') {
          // Perform Sign Up
          user = await signUpWithEmailAndPassword(name, email, password);
          
          // Save session and marketing lead
          try {
            await saveUserSession('qa-feature', user, name);
            await syncMarketingLead(user, 'qa-feature', name);
          } catch (dbError) {
            console.error("Failed to sync user details to Firestore:", dbError);
          }
          
          toast.success("Account created successfully!");
          onSuccess({
            name: name,
            email: user.email || '',
            isLogin: false
          });
        } else {
          // Perform Sign In
          user = await signInWithEmailAndPassword(email, password);
          
          // Update last login
          try {
            await saveUserSession('qa-feature', user);
          } catch (dbError) {
            console.error("Failed to update last login:", dbError);
          }
          
          onSuccess({
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            isLogin: true
          });
        }
      } else {
        // Dev Mock Fallback Simulation
        console.warn("[Firebase] SDK not configured. Running simulation.");
        setTimeout(() => {
          if (mode === 'signup') {
            toast.success(`Demo Mode: Account created for ${name}!`);
            onSuccess({
              name: name,
              email: email,
              isLogin: false
            });
          } else {
            toast.success("Demo Mode: Signed in successfully");
            onSuccess({
              name: email.split('@')[0] || "Demo Developer",
              email: email,
              isLogin: true
            });
          }
        }, 1200);
      }
    } catch (error: any) {
      console.error("Authentication Error:", error);
      toast.error(error.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md relative"
      >
        <Card className="relative border-none shadow-2xl glass overflow-hidden rounded-[2.5rem]">
          <div className="h-2 w-full bg-primary" />
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            aria-label="Close authentication form"
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground rounded-full z-10 hover:bg-muted"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
          
          <CardHeader className="pt-10 pb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl bg-primary">
                <ShieldCheck className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">
              Linguistic Portal
            </CardTitle>
            <CardDescription className="text-base">
              {mode === 'signin' ? 'Sign in to your corporate account' : 'Register a new account'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10 flex flex-col gap-5">
            {!isFirebaseConfigured && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Firebase Config Missing</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                    VITE_FIREBASE_* credentials are not set. Running in **Demo Simulation Mode** for evaluation.
                  </p>
                </div>
              </div>
            )}

            {/* Mode Switch Tabs */}
            <div className="flex bg-muted p-1 rounded-xl mb-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  mode === 'signin' 
                    ? 'bg-background text-foreground shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  mode === 'signup' 
                    ? 'bg-background text-foreground shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name / Username</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-12 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 text-white bg-primary hover:bg-primary/95 shadow-lg"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-500" aria-hidden="true" />
            Isolated App Data
          </div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-green-500" aria-hidden="true" />
            Secure local storage
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

