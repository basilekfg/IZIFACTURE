"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoiceStore } from "@/lib/store/invoiceStore";
import { useClientStore } from "@/lib/store/clientStore";
import { formatFCFA, formatDate } from "@/lib/utils/format";
import { Invoice, InvoiceItem, InvoiceStatus } from "@/types/invoice";
import { Plus, Trash2, ArrowLeft, Eye, Save, Send, Sparkles, CheckCircle, Loader2, X, Check } from "lucide-react";
import Link from "next/link";
import { useSettingsStore } from "@/lib/store/settingsStore";

interface InvoiceFormProps {
  invoiceId?: string;
}

interface TempLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function InvoiceForm({ invoiceId }: InvoiceFormProps) {
  const router = useRouter();
  
  const invoices = useInvoiceStore((state) => state.invoices);
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const updateInvoice = useInvoiceStore((state) => state.updateInvoice);
  const clients = useClientStore((state) => state.clients);
  const { settings, updateSettings } = useSettingsStore();

  const isEditMode = !!invoiceId;
  const existingInvoice = isEditMode 
    ? invoices.find((inv) => inv.id === invoiceId) 
    : null;

  // Form states
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Orange Money");
  const [items, setItems] = useState<TempLineItem[]>([
    { id: "item-init", description: "", quantity: 1, unit_price: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Client modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [isClientSubmitting, setIsClientSubmitting] = useState(false);
  const addClient = useClientStore((state) => state.addClient);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPhone.trim() || !newClientAddress.trim()) {
      alert("Veuillez renseigner tous les champs obligatoires (Nom, Téléphone, Adresse).");
      return;
    }
    setIsClientSubmitting(true);
    try {
      const newId = await addClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
        address: newClientAddress.trim(),
      });
      setClientId(newId); // Select the newly created client automatically
      setNewClientName("");
      setNewClientPhone("");
      setNewClientAddress("");
      setIsClientModalOpen(false);
    } catch (err: any) {
      alert("Une erreur est survenue lors de la création du client: " + err.message);
    } finally {
      setIsClientSubmitting(false);
    }
  };

  // Pre-fill form if editing
  useEffect(() => {
    if (isEditMode && existingInvoice) {
      setClientId(existingInvoice.client_id || "");
      setIssueDate(existingInvoice.issue_date);
      setDueDate(existingInvoice.due_date);
      setPaymentMethod(existingInvoice.payment_method || "Orange Money");
      
      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setItems(
          existingInvoice.items.map((it) => ({
            id: it.id,
            description: it.description,
            quantity: Number(it.quantity),
            unit_price: it.unit_price,
          }))
        );
      }
    } else {
      // Default dates (due in 7 days)
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);
      
      setIssueDate(today.toISOString().split("T")[0]);
      setDueDate(in7Days.toISOString().split("T")[0]);
    }
  }, [isEditMode, existingInvoice]);

  // Handle adding line item
  const handleAddLine = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, description: "", quantity: 1, unit_price: 0 }
    ]);
  };

  // Handle removing line item
  const handleRemoveLine = (id: string) => {
    if (items.length === 1) {
      alert("Une facture doit contenir au moins une ligne d'article.");
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  // Handle line field edits
  const handleLineChange = (id: string, field: keyof TempLineItem, value: string | number) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          return updated;
        }
        return it;
      })
    );
  };

  // Calculations
  const TVA_RATE = settings.tax_rate / 100;

  const calculateLineTotal = (item: TempLineItem) => {
    return Math.round(item.quantity * item.unit_price);
  };

  const total = items.reduce((acc, item) => {
    return acc + calculateLineTotal(item);
  }, 0);

  const subtotal = Math.round(total / (1 + TVA_RATE));
  const taxAmount = total - subtotal;

  // Selected client object for preview
  const selectedClient = clients.find((c) => c.id === clientId) || null;

  // Next sequential invoice number from settings
  const getNextInvoiceNumber = () => {
    if (isEditMode && existingInvoice) return existingInvoice.invoice_number;
    
    const prefix = settings.invoice_prefix || "FAC";
    const year = new Date().getFullYear();
    const nextNum = settings.invoice_next_number || 1;
    const seq = String(nextNum).padStart(4, "0");
    return `${prefix}-${year}-${seq}`;
  };

  const invoiceNumber = getNextInvoiceNumber();

  // Save / Submit Action
  const handleSave = async (status: InvoiceStatus) => {
    if (!clientId) {
      alert("Veuillez sélectionner un client.");
      return;
    }

    const invalidItems = items.some((it) => !it.description.trim() || it.unit_price <= 0);
    if (invalidItems) {
      alert("Veuillez remplir toutes les descriptions et saisir un prix unitaire supérieur à 0.");
      return;
    }

    setIsSaving(true);
    try {
      const mappedItems: Omit<InvoiceItem, "id" | "invoice_id" | "created_at">[] = items.map((it, idx) => ({
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: calculateLineTotal(it),
        sort_order: idx,
      }));

      const invoiceData: Omit<Invoice, "id" | "user_id" | "created_at" | "updated_at"> = {
        client_id: clientId,
        invoice_number: invoiceNumber,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tax_rate: settings.tax_rate,
        tax_amount: taxAmount,
        total,
        amount_paid: status === "paid" ? total : 0,
        payment_method: paymentMethod,
        paid_at: status === "paid" ? new Date().toISOString() : null,
        // Temporarily attach items; store adds them properly
        items: mappedItems as unknown as InvoiceItem[],
      };

      if (isEditMode && existingInvoice) {
        await updateInvoice(existingInvoice.id, {
          ...invoiceData,
          status: existingInvoice.status === "draft" ? status : existingInvoice.status,
        });
        router.push(`/invoices/${existingInvoice.id}`);
      } else {
        const newId = await addInvoice(invoiceData);
        // Increment next invoice number in settings
        await updateSettings({ invoice_next_number: settings.invoice_next_number + 1 });
        router.push(`/invoices/${newId}`);
      }
    } catch (err: any) {
      alert("Une erreur est survenue lors de l'enregistrement de la facture: " + err.message);
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={isEditMode ? `/invoices/${invoiceId}` : "/invoices"}
            className="flex items-center justify-center p-2.5 text-gray-500 hover:text-brand-dark hover:bg-white rounded-xl border border-gray-100 shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-brand-dark">
              {isEditMode ? "Modifier la facture" : "Créer une facture"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Numéro généré : <span className="font-bold text-gray-800">{invoiceNumber}</span>
            </p>
          </div>
        </div>

        {/* Action button controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            disabled={isSaving}
            onClick={() => handleSave("draft")}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs sm:text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 text-gray-500" />
            Sauvegarder comme brouillon
          </button>
          
          <button
            disabled={isSaving}
            onClick={() => handleSave("sent")}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 text-xs sm:text-sm font-extrabold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all shadow-md shadow-emerald-500/15 active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Enregistrer la facture
              </>
            )}
          </button>
        </div>
      </div>

      {/* Split Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Invoice Details Input Form */}
        <div className="space-y-6">
          
          {/* General info Card */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100/30 space-y-5">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3">Détails de la facture</h3>
            
            {/* Client selector dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500">Facturé à (Client) *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
              >
                <option value="">-- Choisir un client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400">
                Si le client n&apos;existe pas, créez-le d&apos;abord dans l&apos;onglet{" "}
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Clients
                </button>.
              </p>
            </div>

            {/* Date Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500">Date d&apos;émission</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500">Date d&apos;échéance</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                />
              </div>
            </div>

            {/* Currency & Payment Methods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500">Devise</label>
                <input
                  value={
                    settings.currency === "XOF" ? "Franc CFA BCEAO (XOF)" :
                    settings.currency === "XAF" ? "Franc CFA BEAC (XAF)" :
                    settings.currency === "GNF" ? "Franc Guinéen (GNF)" :
                    settings.currency === "USD" ? "Dollar US (USD)" :
                    settings.currency === "EUR" ? "Euro (EUR)" :
                    settings.currency === "GBP" ? "Livre Sterling (GBP)" :
                    settings.currency === "CAD" ? "Dollar Canadien (CAD)" :
                    settings.currency === "MAD" ? "Dirham Marocain (MAD)" :
                    settings.currency === "TND" ? "Dinar Tunisien (TND)" :
                    settings.currency === "GHS" ? "Cedi Ghanéen (GHS)" :
                    settings.currency === "NGN" ? "Naira Nigérian (NGN)" :
                    settings.currency
                  }
                  disabled
                  className="w-full px-3 py-2.5 text-sm border border-gray-250 rounded-xl bg-gray-100 text-gray-400 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500">Mode de paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                >
                  <option value="Orange Money">Orange Money</option>
                  <option value="Wave">Wave</option>
                  <option value="MTN Mobile Money">MTN MoMo</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="Espèces">Espèces</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line items input Card */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100/30 space-y-4">
            <div className="border-b border-gray-50 pb-3">
              <h3 className="text-sm font-bold text-gray-800">Articles facturés</h3>
            </div>

            {/* Line items container */}
            <div className="space-y-4 divide-y divide-gray-100 pt-1">
              {items.map((item, idx) => (
                <div key={item.id} className={idx > 0 ? "pt-4 space-y-3" : "space-y-3"}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    
                    {/* Description (Article / Service) */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Article / Service #{idx + 1} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Description de la prestation / produit..."
                        value={item.description}
                        onChange={(e) => handleLineChange(item.id, "description", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Qté *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={(e) => handleLineChange(item.id, "quantity", Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="md:col-span-3 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        P.U. (FCFA) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Ex: 50000"
                        value={item.unit_price === 0 ? "" : item.unit_price}
                        onChange={(e) => handleLineChange(item.id, "unit_price", Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                      />
                    </div>

                    {/* Actions / Delete button */}
                    <div className="md:col-span-1 flex justify-end pb-0.5">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(item.id)}
                          className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all duration-200 shrink-0"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-emerald-800 bg-primary-light border border-primary/20 hover:bg-primary/10 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une ligne
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: LIVE PREVIEW Sheet */}
        <div className="sticky top-24 space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4.5 h-4.5 text-primary animate-pulse" />
              Aperçu en temps réel
            </span>
            <span className="text-emerald-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Auto-calculé
            </span>
          </div>

          {/* Real Preview Sheet */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative overflow-hidden text-[11px] min-h-[500px] flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-dark" />
            
            {/* Top header */}
            <div>
              <div className="flex items-start justify-between pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-brand-dark">
                    {settings.logo_url ? (
                      <img 
                        src={settings.logo_url} 
                        alt="Logo" 
                        className="w-8 h-8 object-contain rounded"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center font-black text-xs">
                        {settings.company_name ? settings.company_name[0].toUpperCase() : "I"}
                      </span>
                    )}
                    IZI Facture
                  </div>
                  <div className="mt-2 text-gray-400 space-y-0.5">
                    <p className="font-semibold text-gray-600">{settings.company_name}</p>
                    {settings.company_address && <p>{settings.company_address}</p>}
                    {(settings.company_city || settings.company_country) && (
                      <p>
                        {settings.company_city}
                        {settings.company_city && settings.company_country ? ", " : ""}
                        {settings.company_country}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="block font-bold text-brand-dark text-xs">FACTURE</span>
                  <span className="block text-gray-500 font-medium mt-0.5">{invoiceNumber}</span>
                  <div className="mt-2 text-[10px] text-gray-400">
                    <p>Émission : {formatDate(issueDate)}</p>
                    <p>Échéance : {formatDate(dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Billing context */}
              <div className="py-5 border-b border-gray-100">
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Client</span>
                {selectedClient ? (
                  <div className="text-gray-600">
                    <p className="font-bold text-brand-dark">{selectedClient.name}</p>
                    <p>{selectedClient.phone || "Pas de téléphone"}</p>
                    <p>{selectedClient.address}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Veuillez choisir un client...</p>
                )}
              </div>

              {/* Items Preview List */}
              <div className="py-5">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider pb-1.5">
                      <th className="pb-2 w-3/5">Article</th>
                      <th className="pb-2 text-center">Qté</th>
                      <th className="pb-2 text-right">PU TTC</th>
                      <th className="pb-2 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 text-brand-dark font-semibold break-words max-w-[150px]">
                          {item.description || <span className="text-gray-300 italic">Description de l&apos;article...</span>}
                        </td>
                        <td className="py-2.5 text-center">{item.quantity}</td>
                        <td className="py-2.5 text-right">{formatFCFA(item.unit_price)}</td>
                        <td className="py-2.5 text-right text-brand-dark font-bold">{formatFCFA(calculateLineTotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom summary and notes */}
            <div className="pt-5 border-t border-gray-100 flex justify-end">

              {/* Totals math */}
              <div className="space-y-1.5 text-gray-500 font-semibold text-right">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="text-brand-dark">{formatFCFA(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA ({settings.tax_rate}%)</span>
                  <span className="text-brand-dark">{formatFCFA(taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-100 text-brand-dark font-black text-sm">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatFCFA(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Client creation Modal */}
    {isClientModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-850">
              Ajouter un client
            </h3>
            <button 
              type="button"
              onClick={() => setIsClientModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleCreateClient} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500">Nom complet *</label>
              <input
                type="text"
                placeholder="Ex: Koffi Mensah"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500">Téléphone *</label>
              <input
                type="text"
                placeholder="Ex: +225 07 00 00 00"
                required
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500">Adresse *</label>
              <input
                type="text"
                placeholder="Ex: Cocody Angré, Rue L5"
                required
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isClientSubmitting}
                className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClientSubmitting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="w-4.5 h-4.5" />
                    Valider
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
