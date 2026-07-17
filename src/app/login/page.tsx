"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Mail, 
  Lock, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  ArrowLeft
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // Auth view toggles: 'signin' | 'signup' | 'forgot_password'
  const [view, setView] = useState<"signin" | "signup" | "forgot_password">("signin");
  
  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // State indicators
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if session already exists
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    }
    checkSession();

    // Switch to signup view if requested
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "signup") {
        setView("signup");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic validation
    if (!email.trim()) {
      setErrorMessage("Veuillez renseigner votre adresse e-mail.");
      setLoading(false);
      return;
    }

    if (view !== "forgot_password" && !password) {
      setErrorMessage("Veuillez renseigner votre mot de passe.");
      setLoading(false);
      return;
    }

    if (view === "signup") {
      if (!companyName.trim()) {
        setErrorMessage("Veuillez renseigner le nom de votre entreprise.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Le mot de passe doit contenir au moins 6 caractères.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Les mots de passe ne correspondent pas.");
        setLoading(false);
        return;
      }
    }

    try {
      if (view === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        
        setSuccessMessage("Connexion réussie. Redirection...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else if (view === "signup") {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              company_name: companyName.trim(),
            }
          }
        });
        if (error) throw error;

        if (data.session) {
          setSuccessMessage("Inscription réussie ! Redirection...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        } else {
          setSuccessMessage("Inscription réussie ! Veuillez vérifier vos e-mails pour confirmer votre compte.");
        }
      } else if (view === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login?type=recovery`,
        });
        if (error) throw error;
        setSuccessMessage("Un e-mail de réinitialisation vous a été envoyé. Veuillez vérifier votre boîte de réception.");
      }
    } catch (err: any) {
      // Translate common errors
      let msg = err.message;
      if (msg === "Invalid login credentials") {
        msg = "Identifiants de connexion invalides.";
      } else if (msg === "User already registered") {
        msg = "Cet e-mail est déjà associé à un compte.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F8F9FA] overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Back button positioned on top-left of page content area */}
      <div className="absolute top-6 left-6 z-20">
        <a 
          href="/landing.html" 
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-emerald-600 hover:border-emerald-300 hover:shadow-sm transition-all active:scale-95 duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </a>
      </div>

      {/* Decorative colored backgrounds matching IZI Facture brand accent colors */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-[#004D40] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />

      <div className="max-w-md w-full space-y-8 relative z-10 animate-in fade-in duration-500">
        
        {/* App Logo & Letterhead */}
        <a href="/landing.html" className="flex flex-col items-center justify-center text-center group cursor-pointer hover:opacity-90 transition-opacity">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#004D40] text-white shadow-xl shadow-emerald-950/20 mb-4 group-hover:scale-105 transition-transform">
            <svg 
              className="w-7 h-7 text-primary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight group-hover:text-emerald-700 transition-colors">
            IZI Facture
          </h2>
          <p className="text-xs text-emerald-600 font-bold tracking-widest uppercase mt-0.5">
            Facturer en un clic
          </p>
        </a>

        {/* Auth card wrapper */}
        <div className="bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-3xl p-8 space-y-6">
          
          {/* Header & Tabs */}
          {view === "forgot_password" ? (
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Mot de passe oublié ?
              </h3>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation de mot de passe.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  {view === "signin" ? "Connexion" : "Créer un compte"}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {view === "signin" 
                    ? "Heureux de vous revoir ! Connectez-vous." 
                    : "Commencez dès aujourd'hui à gérer vos factures."
                  }
                </p>
              </div>

              {/* Horizontal Tabs - Pill segmented control style */}
              <div className="flex bg-gray-50/80 border border-gray-100 p-1 rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setView("signin");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    view === "signin"
                      ? "bg-white text-emerald-600 shadow-sm border border-gray-150/10"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("signup");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    view === "signup"
                      ? "bg-white text-emerald-600 shadow-sm border border-gray-150/10"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Inscription
                </button>
              </div>
            </div>
          )}

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 animate-in slide-in-from-top-2 duration-350">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
              <div className="text-xs font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 animate-in slide-in-from-top-2 duration-350">
              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
              <div className="text-xs font-semibold leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Company name field - only for signup */}
            {view === "signup" && (
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nom de l'entreprise</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ma Super Entreprise"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium text-sm"
                  />
                </div>
              </div>
            )}
            
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium text-sm"
                />
              </div>
            </div>

            {/* Password field - not for forgot_password */}
            {view !== "forgot_password" && (
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium text-sm"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password field - only for signup */}
            {view === "signup" && (
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium text-sm"
                  />
                </div>
              </div>
            )}

            {/* Forgot password link - only for signin */}
            {view === "signin" && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setView("forgot_password");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-sm font-extrabold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    {view === "signin" && "Se connecter"}
                    {view === "signup" && "S'inscrire"}
                    {view === "forgot_password" && "Envoyer le lien"}
                    <ArrowRight className="w-4.5 h-4.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Toggle / Back link */}
          <div className="text-center pt-2">
            {view === "forgot_password" ? (
              <button
                type="button"
                onClick={() => {
                  setView("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-gray-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setView(view === "signin" ? "signup" : "signin");
                  setCompanyName("");
                  setPassword("");
                  setConfirmPassword("");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                {view === "signin" 
                  ? "Pas encore de compte ? S'inscrire" 
                  : "Déjà un compte ? Se connecter"
                }
              </button>
            )}
          </div>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
          Sécurisé par authentification Supabase & chiffrement SSL
        </div>
      </div>
    </div>
  );
}
