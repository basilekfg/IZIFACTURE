"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useInvoiceStore } from "@/lib/store/invoiceStore";
import { useClientStore } from "@/lib/store/clientStore";
import { formatFCFA, formatDate } from "@/lib/utils/format";
import Badge from "@/components/ui/Badge";
import { 
  Plus, 
  Search, 
  ChevronRight, 
  ArrowUpDown,
  Download,
  FileText
} from "lucide-react";

export default function InvoicesListPage() {
  const invoices = useInvoiceStore((state) => state.invoices);
  const clients = useClientStore((state) => state.clients);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "number" | "total">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Get client details for invoice
  const getClientForInvoice = (clientId: string | null) => {
    return clients.find((c) => c.id === clientId) || null;
  };

  // Helper to count invoices by status
  const getStatusCount = (status: string) => {
    if (status === "all") return invoices.length;
    return invoices.filter((inv) => inv.status === status).length;
  };

  // Handle Sort Toggle
  const handleSort = (field: "date" | "number" | "total") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Filtered & Sorted Invoices
  const filteredInvoices = invoices
    .map((inv) => ({
      ...inv,
      clientObj: getClientForInvoice(inv.client_id),
    }))
    .filter((inv) => {
      // Search filter
      const matchesSearch = inv.clientObj
        ? inv.clientObj.name.toLowerCase().includes(searchQuery.toLowerCase())
        : false;
      const matchesNumber = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      const searchMatch = matchesSearch || matchesNumber || searchQuery === "";

      // Status filter
      const statusMatch = selectedStatus === "all" || inv.status === selectedStatus;

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
      } else if (sortBy === "number") {
        comparison = a.invoice_number.localeCompare(b.invoice_number);
      } else if (sortBy === "total") {
        comparison = a.total - b.total;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const statuses = [
    { value: "all", label: "Toutes" },
    { value: "draft", label: "Brouillons" },
    { value: "sent", label: "Envoyées" },
    { value: "paid", label: "Payées" },
    { value: "overdue", label: "En retard" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-dark">
            Factures émise
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez, filtrez et suivez vos facturations clients en FCFA.
          </p>
        </div>
        <div className="flex items-center gap-3">

          <Link
            href="/invoices/new"
            className="flex items-center gap-2.5 px-6 py-3.5 text-sm md:text-base font-extrabold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nouvelle facture
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col gap-5 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100/30">
        
        {/* Search & Sorting bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search field */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 text-brand-dark"
            />
          </div>

          {/* Quick Stats count */}
          <div className="text-xs font-semibold text-gray-400">
            Affichage de <span className="text-brand-dark">{filteredInvoices.length}</span> sur <span className="text-brand-dark">{invoices.length}</span> factures
          </div>
        </div>

        {/* Status filters (Horizontal Pills scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          <div className="flex items-center gap-2">
            {statuses.map((tab) => {
              const count = getStatusCount(tab.value);
              const isActive = selectedStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedStatus(tab.value)}
                  className={isActive 
                    ? "flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-800 bg-primary-light border border-primary/20 rounded-xl transition-all duration-200 shrink-0"
                    : "flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-brand-dark hover:bg-gray-50 border border-transparent rounded-xl transition-all duration-200 shrink-0"
                  }
                >
                  {tab.label}
                  <span className={isActive 
                    ? "bg-emerald-200/50 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-black" 
                    : "bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[10px] font-bold"
                  }>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100/30 overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150 select-none">
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors"
                      onClick={() => handleSort("number")}
                    >
                      <div className="flex items-center gap-1">
                        Numéro
                        <ArrowUpDown className="w-3 h-3 text-gray-300" />
                      </div>
                    </th>
                    <th className="px-6 py-4">Client</th>
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        Date d&apos;émission
                        <ArrowUpDown className="w-3 h-3 text-gray-300" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors"
                      onClick={() => handleSort("total")}
                    >
                      <div className="flex items-center gap-1">
                        Montant TTC
                        <ArrowUpDown className="w-3 h-3 text-gray-300" />
                      </div>
                    </th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium">
                  {filteredInvoices.map((inv) => (
                    <tr 
                      key={inv.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-brand-dark font-bold">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-primary transition-colors hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8.5 h-8.5 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs">
                            {inv.clientObj?.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <span className="block text-gray-800 font-semibold">{inv.clientObj?.name}</span>
                            <span className="block text-xs text-gray-400 font-normal">{inv.clientObj?.phone || "Pas de téléphone"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(inv.issue_date)}
                      </td>
                      <td className="px-6 py-4 text-brand-dark font-extrabold">
                        {formatFCFA(inv.total)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            href={`/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-primary hover:bg-gray-55 rounded-xl border border-gray-150 hover:border-primary/20 transition-all duration-200"
                          >
                            Détail
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Grid List View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {/* Header */}
              <div className="grid grid-cols-12 gap-1.5 bg-gray-50 py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                <div className="col-span-2">N°</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2 text-center">Date</div>
                <div className="col-span-3 text-right">Montant</div>
                <div className="col-span-2 text-right">Statut</div>
              </div>
              {/* Body */}
              {filteredInvoices.map((inv) => {
                const dateStr = formatDate(inv.issue_date);
                const displayDate = dateStr.length === 10 ? dateStr.slice(0, 5) : dateStr; // formats to "DD/MM"
                
                return (
                  <Link 
                    key={inv.id} 
                    href={`/invoices/${inv.id}`}
                    className="grid grid-cols-12 gap-1.5 items-center py-3.5 px-4 text-[11px] font-semibold text-gray-700 hover:bg-gray-50/50 active:bg-gray-100/50 transition-colors"
                  >
                    <div className="col-span-2 font-bold text-brand-dark truncate">
                      {inv.invoice_number}
                    </div>
                    <div className="col-span-3 text-gray-800 font-semibold truncate">
                      {inv.clientObj?.name || "Client"}
                    </div>
                    <div className="col-span-2 text-center text-gray-500 font-medium">
                      {displayDate}
                    </div>
                    <div className="col-span-3 text-brand-dark font-extrabold text-right truncate">
                      {formatFCFA(inv.total).replace(" FCFA", " F")}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Badge status={inv.status} className="px-1.5 py-0.5 text-[9px] scale-90 origin-right shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-55/10 text-gray-400 bg-gray-50 border border-gray-100">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">Aucune facture trouvée</h3>
            <p className="mt-1 text-xs text-gray-400 max-w-sm">
              Aucun résultat ne correspond à vos filtres de recherche. Essayez d&apos;ajuster vos critères ou créez une facture.
            </p>
            <Link
              href="/invoices/new"
              className="mt-6 flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-200 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Créer une facture
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
