"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInvoiceStore } from "@/lib/store/invoiceStore";
import { useClientStore } from "@/lib/store/clientStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { formatFCFA, formatDate } from "@/lib/utils/format";
import Badge from "@/components/ui/Badge";
import { InvoiceStatus } from "@/types/invoice";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  ChevronDown,
  Printer,
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const invoiceId = params.id;

  const invoice = useInvoiceStore((state) => 
    state.invoices.find((i) => i.id === invoiceId)
  );
  
  const clients = useClientStore((state) => state.clients);
  const { settings } = useSettingsStore();
  const deleteInvoice = useInvoiceStore((state) => state.deleteInvoice);
  const updateInvoiceStatus = useInvoiceStore((state) => state.updateInvoiceStatus);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-print-area");
    if (!element) return;

    setIsGeneratingPDF(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 size width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`facture-${invoice?.invoice_number || "detail"}.pdf`);
    } catch (err: any) {
      alert("Une erreur est survenue lors de la génération du PDF: " + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 text-red-500">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-800">Facture introuvable</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm">
          La facture avec l&apos;ID spécifié n&apos;existe pas ou a été supprimée.
        </p>
        <Link
          href="/invoices"
          className="mt-6 flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux factures
        </Link>
      </div>
    );
  }

  const client = clients.find((c) => c.id === invoice.client_id) || null;

  // Handle Delete Action
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoice(invoice.id);
      router.push("/invoices");
    } catch (err: any) {
      alert("Une erreur est survenue lors de la suppression de la facture: " + err.message);
      setIsDeleting(false);
    }
  };

  // Handle Status Update
  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      setShowStatusDropdown(false);
    } catch (err: any) {
      alert("Une erreur est survenue lors de la mise à jour du statut: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusOptions: { value: InvoiceStatus; label: string }[] = [
    { value: "draft", label: "Marquer Brouillon" },
    { value: "sent", label: "Marquer Envoyée" },
    { value: "paid", label: "Marquer Payée" },
    { value: "overdue", label: "Marquer En Retard" },
    { value: "cancelled", label: "Marquer Annulée" },
  ];

  return (
    <>
      {/* Print-specific style sheet override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide non-invoice elements */
          aside, header, nav, footer, .print\\:hidden, #show-status-dropdown-bg {
            display: none !important;
          }
          /* Reset container wrappers layout */
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          main, div, section {
            position: relative !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            width: auto !important;
          }
          /* Force exact paper sheet size and styles */
          #invoice-print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 20mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Header section with back button and top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="flex items-center justify-center p-2.5 text-gray-500 hover:text-brand-dark hover:bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-200"
            title="Retour à la liste"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-brand-dark flex items-center gap-3">
              {invoice.invoice_number}
              <Badge status={invoice.status} />
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Créée le {formatDate(invoice.issue_date)} • Échéance le {formatDate(invoice.due_date)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status Changer dropdown */}
          <div className="relative">
            <button
              disabled={isUpdatingStatus}
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-250 hover:bg-gray-50 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Mise à jour...
                </>
              ) : (
                <>
                  Statut
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </>
              )}
            </button>
            
            {showStatusDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowStatusDropdown(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-gray-50 py-1">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button 
            disabled={isGeneratingPDF}
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Génération...
              </>
            ) : (
              <>
                <Printer className="w-4.5 h-4.5" />
                PDF
              </>
            )}
          </button>

          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <Edit3 className="w-4.5 h-4.5 text-gray-500" />
            Modifier
          </Link>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200 shadow-md shadow-red-500/10 active:scale-95"
          >
            <Trash2 className="w-4.5 h-4.5" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Main content grid: Paper Invoice View (2/3 width) + Metadata Summary (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Paper Invoice sheet (left/center) */}
        <div 
          id="invoice-print-area"
          className="lg:col-span-2 bg-white border border-gray-100 rounded-sm shadow-md shadow-gray-200/50 p-8 md:p-12 relative overflow-hidden mx-auto w-full max-w-[210mm] min-h-[297mm] print:shadow-none print:max-w-none print:min-h-0 print:border-none"
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
        >
          
          {/* Top border decor accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary-dark" />

          {/* Status Stamp removed from here to prevent overlapping header details */}

          {/* Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-gray-100">
            <div>
              {/* Logo block */}
              <div className="flex items-center gap-2">
                {settings.logo_url ? (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="w-10 h-10 object-contain rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-black text-sm">
                    {settings.company_name ? settings.company_name[0].toUpperCase() : "I"}
                  </div>
                )}
                <span className="text-base font-extrabold text-brand-dark tracking-tight">IZI Facture</span>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-800">{settings.company_name}</p>
                {settings.company_address && <p>{settings.company_address}</p>}
                {(settings.company_city || settings.company_country) && (
                  <p>
                    {settings.company_city}
                    {settings.company_city && settings.company_country ? ", " : ""}
                    {settings.company_country}
                  </p>
                )}
                {settings.company_phone && <p>Téléphone : {settings.company_phone}</p>}
              </div>
            </div>
            
            <div className="sm:text-right">
              <h2 className="text-xl font-black text-brand-dark">FACTURE</h2>
              <p className="text-sm font-bold text-gray-600 mt-1">{invoice.invoice_number}</p>
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p><span className="font-semibold">Date d&apos;émission :</span> {formatDate(invoice.issue_date)}</p>
                <p><span className="font-semibold">Date d&apos;échéance :</span> {formatDate(invoice.due_date)}</p>
                {invoice.paid_at && (
                  <p className="text-emerald-600 font-semibold">
                    <span className="font-semibold">Payée le :</span> {formatDate(invoice.paid_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Client billing context */}
          <div className="py-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-gray-100">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Client</span>
              {client ? (
                <div className="space-y-1">
                  <p className="font-bold text-brand-dark text-sm">{client.name}</p>
                  <p className="text-gray-600">{client.phone || "Pas de téléphone"}</p>
                  <p className="text-gray-600">{client.address}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic">Aucun client lié à cette facture</p>
              )}
            </div>
            
            <div className="sm:text-right flex flex-col justify-end">
              <div className="space-y-1 text-gray-600">
                <p><span className="font-semibold">Mode de règlement :</span> {invoice.payment_method || "Non spécifié"}</p>
                <p>
                  <span className="font-semibold">Devise :</span>{" "}
                  {settings.currency === "XOF" || settings.currency === "XAF"
                    ? `Franc CFA (${settings.currency})`
                    : settings.currency === "EUR"
                    ? "Euro (€)"
                    : settings.currency === "USD"
                    ? "Dollar ($)"
                    : settings.currency}
                </p>
                <p><span className="font-semibold">Conditions :</span> Paiement à réception</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-8">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-250 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 w-3/5">Article / Service</th>
                  <th className="pb-3 text-center">Qté</th>
                  <th className="pb-3 text-right">Prix Unitaire TTC</th>
                  <th className="pb-3 text-right">Montant TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 text-brand-dark text-sm font-semibold max-w-xs break-words">
                        {item.description}
                      </td>
                      <td className="py-4 text-center text-gray-600">
                        {Number(item.quantity)}
                      </td>
                      <td className="py-4 text-right text-gray-600">
                        {formatFCFA(item.unit_price)}
                      </td>
                      <td className="py-4 text-right text-brand-dark font-extrabold">
                        {formatFCFA(item.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400 italic">
                      Aucune ligne d&apos;article sur cette facture
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="pt-6 border-t border-gray-150 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6">
            
            {/* Status Stamp (Watermark) */}
            <div className="pointer-events-none transform rotate-6 opacity-95 print:opacity-100 self-center sm:self-start sm:ml-4 sm:mb-2 select-none">
              {invoice.status === 'paid' && (
                <div className="border-4 border-emerald-500 rounded-lg px-6 py-2 text-emerald-500 font-black text-2xl md:text-3xl uppercase tracking-widest bg-white shadow-sm inline-block">
                  PAYÉ
                </div>
              )}
              {invoice.status === 'sent' && (
                <div className="border-4 border-amber-500 rounded-lg px-6 py-2 text-amber-500 font-black text-2xl md:text-3xl uppercase tracking-widest bg-white shadow-sm inline-block">
                  EN ATTENTE
                </div>
              )}
              {invoice.status === 'draft' && (
                <div className="border-4 border-gray-400 rounded-lg px-6 py-2 text-gray-400 font-black text-2xl md:text-3xl uppercase tracking-widest bg-white shadow-sm inline-block">
                  BROUILLON
                </div>
              )}
              {invoice.status === 'overdue' && (
                <div className="border-4 border-red-500 rounded-lg px-6 py-2 text-red-500 font-black text-2xl md:text-3xl uppercase tracking-widest bg-white shadow-sm inline-block">
                  EN RETARD
                </div>
              )}
              {invoice.status === 'cancelled' && (
                <div className="border-4 border-gray-600 rounded-lg px-6 py-2 text-gray-600 font-black text-2xl md:text-3xl uppercase tracking-widest bg-white shadow-sm inline-block">
                  ANNULÉ
                </div>
              )}
            </div>
            {/* Calculations block */}
            <div className="w-full sm:w-1/2 space-y-2.5 text-xs text-gray-600 font-semibold">
              <div className="flex justify-between">
                <span>Sous-total HT</span>
                <span className="text-brand-dark">{formatFCFA(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({invoice.tax_rate}%)</span>
                <span className="text-brand-dark">{formatFCFA(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-gray-100 text-brand-dark font-black text-base">
                <span>Total TTC</span>
                <span className="text-primary">{formatFCFA(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info pane (sidebar stats) */}
        <div className="space-y-6 print:hidden">
          {/* Status summary Card */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100/30">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Statut financier</h3>
            
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-gray-400">Montant total</span>
                <span className="block text-xl font-extrabold text-brand-dark">{formatFCFA(invoice.total)}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-400">Montant réglé</span>
                <span className="block text-xl font-extrabold text-emerald-600">
                  {formatFCFA(invoice.amount_paid)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-400">Reste à payer</span>
                <span className="block text-xl font-extrabold text-red-500">
                  {formatFCFA(invoice.total - (invoice.amount_paid || 0))}
                </span>
              </div>

              {/* Progress bar */}
              <div className="pt-2">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${invoice.total > 0 ? (invoice.amount_paid / invoice.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-bold">
                  <span>Payé à {Math.round((invoice.total > 0 ? (invoice.amount_paid / invoice.total) * 100 : 0))}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          {/* Modal box */}
          <div className="relative bg-white border border-gray-100 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex items-center justify-center w-10 h-10 bg-red-50 border border-red-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Supprimer la facture</h3>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement la facture <span className="font-bold text-brand-dark">{invoice.invoice_number}</span> ? Cette action effacera également toutes les lignes d&apos;articles associées et ne pourra pas être annulée.
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-brand-dark hover:bg-gray-50 border border-transparent rounded-xl transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/10 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    Confirmer la suppression
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
