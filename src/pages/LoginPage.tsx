import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Droplet, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setLoading(true);

      // Check for profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      let role = '';
      if (!userDoc.exists()) {
        // First time login - Bootstrap super admin if email matches
        if (user.email === "customercare_india@apascosmotech.com") {
          role = 'super_admin';
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email,
            role: 'super_admin',
            tenantId: 'system_root',
            active: true,
            createdAt: serverTimestamp()
          });
        } else {
            throw new Error("ERP Profile not found. Please contact your administrator.");
        }
      } else {
          role = userDoc.data().role;
      }

      redirectByRole(role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'super_admin': navigate('/super'); break;
      case 'admin': navigate('/admin'); break;
      case 'salesman': navigate('/salesman'); break;
      case 'customer': navigate('/portal'); break;
      default: navigate('/');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-brand-bg text-brand-text font-sans">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-brand-sidebar text-white">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-brand-accent rounded">
             <Droplet className="w-6 h-6 text-white" />
           </div>
           <span className="text-2xl font-extrabold uppercase tracking-tight">LubriERP <span className="text-white/40">Pro</span></span>
        </div>
        
        <div className="max-w-md">
          <h2 className="text-7xl font-black leading-[0.9] mb-8 uppercase tracking-tighter">Secure <br /> Enterprise <br /> Gateway.</h2>
          <p className="text-white/50 font-medium text-sm leading-tight border-l-2 border-brand-accent pl-6 py-2">
            Multi-tenant architectural security ensures data isolation and regulatory compliance for your manufacturing operations.
          </p>
        </div>

        <div className="flex gap-4 items-center">
          <ShieldCheck className="w-5 h-5 text-brand-accent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Encrypted Session // TLS 1.3 Active</span>
        </div>
      </div>

      <div className="flex flex-col justify-center px-8 md:px-20 lg:px-32 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <Droplet className="w-8 h-8 text-brand-accent" />
            <span className="text-2xl font-black uppercase tracking-tighter">LubriERP Pro</span>
          </div>

          <h3 className="text-2xl font-extrabold uppercase mb-1 tracking-tight">System Login</h3>
          <p className="text-brand-text-muted font-bold text-[10px] mb-10 uppercase tracking-widest">Authorized Access Only // Corporate Instance</p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-tight text-brand-text-muted flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Identity Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="w-full bg-white border border-brand-border p-3 rounded text-sm focus:outline-none focus:ring-1 ring-brand-accent/30 font-bold placeholder:text-brand-text-muted/40"
                placeholder="identity@industry.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-tight text-brand-text-muted flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Security Gateway Key
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-brand-border p-3 rounded text-sm focus:outline-none focus:ring-1 ring-brand-accent/30 font-bold placeholder:text-brand-text-muted/40"
                placeholder="••••••••"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-3 bg-red-50 border border-danger/20 text-danger text-[10px] font-bold uppercase rounded"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            disabled={loading}
            onClick={() => navigate('/admin')}
            className="w-full mt-10 bg-brand-sidebar text-white py-4 flex items-center justify-between px-6 hover:bg-zinc-800 transition-all shadow-xl shadow-brand-sidebar/10 rounded disabled:opacity-50 group"
          >
            <span className="text-base font-extrabold uppercase tracking-tight">{loading ? 'Verifying...' : 'Access Console'}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('/admin')}
            className="w-full mt-4 bg-white border border-brand-border py-4 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-bold uppercase text-[11px] rounded tracking-tight text-brand-text-muted"
          >
            Enter as Guest (Demo)
          </button>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest"><span className="bg-brand-bg px-4 text-brand-text-muted">Federated WorkID</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mt-8 bg-white border border-brand-border py-4 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-bold uppercase text-[11px] rounded tracking-tight group"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google SSO
          </button>
        </motion.div>
      </div>
    </div>
  );
}
