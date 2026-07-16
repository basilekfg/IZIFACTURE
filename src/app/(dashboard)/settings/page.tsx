"use client";

import React, { useState, useEffect } from "react";
import { 
  Building, 
  Sliders, 
  Check, 
  HelpCircle,
  Percent,
  User,
  CreditCard,
  Bell,
  Lock,
  Camera,
  Save,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { clsx } from "clsx";
import { useSettingsStore } from "@/lib/store/settingsStore";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { settings, updateSettings } = useSettingsStore();

  // Form states initialized from store
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [companyEmail, setCompanyEmail] = useState(settings.company_email || "");
  const [companyPhone, setCompanyPhone] = useState(settings.company_phone || "");
  const [companyAddress, setCompanyAddress] = useState(settings.company_address || "");
  const [companyCity, setCompanyCity] = useState(settings.company_city || "");
  const [companyCountry, setCompanyCountry] = useState(settings.company_country);
  const [taxId, setTaxId] = useState(settings.tax_id || "");
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix);
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(settings.invoice_next_number);
  const [taxRate, setTaxRate] = useState(settings.tax_rate);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || "");
  const [currency, setCurrency] = useState(settings.currency || "XOF");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Synchroniser les champs du formulaire quand les paramètres sont chargés depuis la base de données
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name);
      setCompanyEmail(settings.company_email || "");
      setCompanyPhone(settings.company_phone || "");
      setCompanyAddress(settings.company_address || "");
      setCompanyCity(settings.company_city || "");
      setCompanyCountry(settings.company_country);
      setTaxId(settings.tax_id || "");
      setInvoicePrefix(settings.invoice_prefix);
      setInvoiceNextNumber(settings.invoice_next_number);
      setTaxRate(settings.tax_rate);
      setLogoUrl(settings.logo_url || "");
      setCurrency(settings.currency || "XOF");
    }
  }, [settings]);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Le logo ne doit pas dépasser 2Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        setLogoUrl(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        company_name: companyName,
        company_email: companyEmail,
        company_phone: companyPhone,
        company_address: companyAddress,
        company_city: companyCity,
        company_country: companyCountry,
        tax_id: taxId,
        invoice_prefix: invoicePrefix,
        invoice_next_number: Number(invoiceNextNumber),
        tax_rate: Number(taxRate),
        logo_url: logoUrl || null,
        currency: currency,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      alert("Une erreur est survenue lors de l'enregistrement des paramètres: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const countries = [
    "Côte d'Ivoire", "Sénégal", "Togo", "Mali", "Bénin", 
    "Burkina Faso", "Cameroun", "Gabon", "Guinée", "Niger",
  ];

  const tabs = [
    { id: "profile", label: "Profil Entreprise", icon: Building },
    { id: "billing", label: "Facturation & Taxes", icon: CreditCard },
    { id: "security", label: "Sécurité", icon: ShieldCheck },
  ];

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Elegant Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sidebar to-sidebar-hover p-8 shadow-lg shadow-emerald-900/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Paramètres</h1>
            <p className="text-emerald-100/80 mt-2 text-sm max-w-lg leading-relaxed">
              Gérez les informations de votre entreprise, vos préférences de facturation et sécurisez votre compte depuis cet espace.
            </p>
          </div>
          <button 
            disabled={isSaving}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 text-sm font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200/60 pb-px overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold transition-all duration-300 border-b-2 whitespace-nowrap",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50/50 rounded-t-xl"
              )}
            >
              <Icon className={clsx("w-4.5 h-4.5", isActive ? "text-primary" : "text-gray-400")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="mt-8">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            
            {/* Logo & Branding */}
            <div className="p-8 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-gray-200/40 rounded-3xl">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-primary">
                  <Camera className="w-5 h-5" />
                </div>
                Identité Visuelle
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group cursor-pointer" onClick={handleLogoClick}>
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo de l'entreprise" 
                      className="w-28 h-28 rounded-3xl bg-white border border-gray-150 object-contain shadow-sm transition-all group-hover:border-primary"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-28 h-28 rounded-3xl bg-emerald-50 text-primary border-2 border-dashed border-primary/30 font-black text-3xl shadow-sm transition-all group-hover:border-primary">
                      BM
                    </div>
                  )}
                  <button type="button" className="absolute -bottom-2 -right-2 p-2.5 bg-white text-gray-700 shadow-md border border-gray-100 rounded-full hover:text-primary transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <h4 className="font-bold text-gray-800">Logo de l'entreprise</h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Ce logo apparaîtra sur vos factures et devis. Formats recommandés : PNG transparent ou JPG carré (max 2Mo).
                  </p>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="p-8 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-gray-200/40 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-primary">
                  <Building className="w-5 h-5" />
                </div>
                Informations Générales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Raison sociale *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email de contact</label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Téléphone</label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Identifiant Fiscal (NIF)</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Adresse complète</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ville</label>
                  <input
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pays</label>
                  <select
                    value={companyCountry}
                    onChange={(e) => setCompanyCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium appearance-none"
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === "billing" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="p-8 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-gray-200/40 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-primary">
                  <Sliders className="w-5 h-5" />
                </div>
                Paramètres de facturation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Préfixe des factures</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full pl-4 pr-16 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium uppercase"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-bold text-gray-400">
                      -2026-0001
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Taux de TVA par défaut (%)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <Percent className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Devise / Monnaie de facturation</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                  >
                    <option value="XOF">Franc CFA BCEAO (XOF)</option>
                    <option value="XAF">Franc CFA BEAC (XAF)</option>
                    <option value="GNF">Franc Guinéen (GNF)</option>
                    <option value="USD">Dollar US ($ - USD)</option>
                    <option value="EUR">Euro (€ - EUR)</option>
                    <option value="GBP">Livre Sterling (£ - GBP)</option>
                    <option value="CAD">Dollar Canadien (CAD)</option>
                    <option value="MAD">Dirham Marocain (MAD)</option>
                    <option value="TND">Dinar Tunisien (TND)</option>
                    <option value="GHS">Cedi Ghanéen (GHS)</option>
                    <option value="NGN">Naira Nigérian (NGN)</option>
                  </select>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="p-8 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-gray-200/40 rounded-3xl flex flex-col items-center justify-center text-center h-64">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Sécurité du Compte</h3>
              <p className="text-sm text-gray-500 max-w-md mt-2">
                Les options de changement de mot de passe et d'authentification à deux facteurs seront disponibles dans la prochaine mise à jour de l'application.
              </p>
            </div>
          </div>
        )}

      </form>
    </div>

    {/* Success Confirmation Modal */}
    {showSuccessModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <div 
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm"
          onClick={() => setShowSuccessModal(false)}
        />
        
        {/* Modal box */}
        <div className="relative bg-white border border-gray-100 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full text-primary shadow-inner">
            <Check className="w-6 h-6 animate-bounce" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">Sauvegarde réussie</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Les paramètres de votre entreprise ont été modifiés avec succès. Les modifications seront prises en compte sur toutes vos prochaines factures.
            </p>
          </div>
          
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
}
