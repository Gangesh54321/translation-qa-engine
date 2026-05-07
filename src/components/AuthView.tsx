import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  X, 
  ShieldCheck,
  UserPlus, 
  CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface AuthViewProps {
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string }) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSuccess({ 
        name: isLogin ? email.split('@')[0] : name, 
        email 
      });
    }, 1500);
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
          
          <CardHeader className="pt-10 pb-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl bg-primary">
                <ShieldCheck className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-base">
              {isLogin 
                ? 'Sign in to access TransTech Hub' 
                : 'Join the industry standard for linguistic intelligence'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <div role="tablist" aria-label="Authentication mode" className="flex p-1 bg-muted/50 rounded-2xl mb-8">
              <button
                role="tab"
                aria-selected={isLogin}
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={!isLogin}
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  !isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label htmlFor="auth-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                    <div className="relative">
                      <Input 
                        id="auth-name"
                        placeholder="John Doe" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-muted/30 border-none ring-offset-background focus-visible:ring-primary"
                        required={!isLogin}
                      />
                      <UserPlus className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label htmlFor="auth-email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <div className="relative">
                  <Input 
                    id="auth-email"
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-muted/30 border-none ring-offset-background focus-visible:ring-primary"
                    required
                  />
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label htmlFor="auth-password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</label>
                  {isLogin && (
                    <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot password?</button>
                  )}
                </div>
                <div className="relative">
                  <Input 
                    id="auth-password"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-muted/30 border-none ring-offset-background focus-visible:ring-primary"
                    required
                  />
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-bold mt-6 text-base bg-primary shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-bold text-primary hover:underline"
                >
                  {isLogin ? 'Sign up now' : 'Sign in instead'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-500" aria-hidden="true" />
              5 Free Credits on Signup
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-500" aria-hidden="true" />
              Universal format support
            </div>
          </motion.div>
      </motion.div>
    </motion.div>
  );
};
