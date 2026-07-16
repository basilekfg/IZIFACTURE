"use client";

import React, { useState, useEffect } from "react";
import { useClientStore } from "@/lib/store/clientStore";
import { useInvoiceStore } from "@/lib/store/invoiceStore";
import { formatFCFA } from "@/lib/utils/format";
import { Client } from "@/types/invoice";
import { 
  Users, 
  Search, 
  Edit3, 
  Trash2, 
  Plus,
  X,
  Check,
  Loader2
} from "lucide-react";
import Badge from "@/components/ui/Badge";

export default function ClientsPage() {
  const clients = useClientStore((state) => state.clients);
  const addClient = useClientStore((state) => state.addClient);
  const updateClient = useClientStore((state) => state.updateClient);
  const deleteClient = useClientStore((state) => state.deleteClient);
  const invoices = useInvoiceStore((state) => state.invoices);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setIsModalOpen(true);
        window.history.replaceState(null, '', '/clients');
      }
    }
  }, []);
  
  // Form editing states
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get invoice statistics for a client
  const getClientInvoiceStats = (clientId: string) => {
    const clientInvoices = invoices.filter((inv) => inv.client_id === clientId);
    const totalAmount = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
    return {
      count: clientInvoices.length,
      total: totalAmount,
    };
  };

  // Reset form inputs
  const resetForm = () => {
    setEditingClientId(null);
    setName("");
    setPhone("");
    setAddress("");
    setIsModalOpen(false);
  };

  // Pre-fill form for editing
  const handleStartEdit = (client: Client) => {
    setEditingClientId(client.id);
    setName(client.name);
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setIsModalOpen(true);
  };

  // Submit action (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert("Veuillez renseigner tous les champs obligatoires (Nom, Téléphone, Adresse).");
      return;
    }

    const clientData = {
      name,
      phone: phone.trim(),
      address: address.trim(),
    };

    setIsSubmitting(true);
    try {
      if (editingClientId) {
        await updateClient(editingClientId, clientData);
      } else {
        await addClient(clientData);
      }
      resetForm();
    } catch (err: any) {
      alert("Une erreur est survenue lors de l'enregistrement du client: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete click with custom modal confirmation
  const handleDeleteClick = (id: string, name: string) => {
    setClientToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      setIsDeleting(true);
      try {
        await deleteClient(clientToDelete.id);
        if (editingClientId === clientToDelete.id) resetForm();
        setClientToDelete(null);
      } catch (err: any) {
        alert("Une erreur est survenue lors de la suppression du client: " + err.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Filtered clients list
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.phone && client.phone.includes(searchQuery))
  );

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-dark">
            Gestion des Clients
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos clients et suivez le montant cumulé de leurs factures.
          </p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3.5 text-sm md:text-base font-extrabold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Ajouter un nouveau client
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-md shadow-gray-200/50">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 text-brand-dark"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm shadow-gray-100/30 overflow-hidden">
        {filteredClients.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150">
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Adresse</th>
                    <th className="px-6 py-4 text-center">Factures</th>
                    <th className="px-6 py-4 text-right">CA Généré</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium">
                  {filteredClients.map((client) => {
                    const stats = getClientInvoiceStats(client.id);
                    return (
                      <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs">
                              {client.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="block text-gray-800 font-semibold">{client.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {client.phone || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {client.address || "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-500">
                          {stats.count}
                        </td>
                        <td className="px-6 py-4 text-brand-dark font-extrabold text-right">
                          {formatFCFA(stats.total)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(client)}
                              className="p-1.5 text-gray-400 hover:text-primary hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(client.id, client.name)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Grid List View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {/* Header */}
              <div className="grid grid-cols-12 gap-1.5 bg-gray-50 py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                <div className="col-span-4">Client</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-3 text-right">CA Généré</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {/* Body */}
              {filteredClients.map((client) => {
                const stats = getClientInvoiceStats(client.id);
                return (
                  <div 
                    key={client.id}
                    className="grid grid-cols-12 gap-1.5 items-center py-3.5 px-4 text-[11px] font-semibold text-gray-750 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 font-bold text-[9px] shrink-0">
                        {client.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="text-gray-800 font-semibold truncate">
                        {client.name}
                      </div>
                    </div>
                    <div className="col-span-3 text-gray-500 font-medium truncate">
                      {client.phone || "-"}
                    </div>
                    <div className="col-span-3 text-brand-dark font-extrabold text-right truncate">
                      {formatFCFA(stats.total).replace(" FCFA", " F")}
                    </div>
                    <div className="col-span-2 flex justify-end gap-1 select-none">
                      <button
                        onClick={() => handleStartEdit(client)}
                        className="p-1 text-gray-400 hover:text-primary hover:bg-emerald-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(client.id, client.name)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr>
                  <td className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Users className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-sm font-bold text-gray-800">Aucun client trouvé</p>
                      <p className="text-xs mt-1">Créez un nouveau client ou modifiez votre recherche.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

      {/* Modal / Popup for Adding/Editing Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingClientId ? "Modifier le client" : "Ajouter un client"}
              </h3>
              <button 
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500">Nom complet *</label>
                <input
                  type="text"
                  placeholder="Ex: Koffi Mensah"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500">Téléphone *</label>
                <input
                  type="text"
                  placeholder="Ex: +225 07 00 00 00"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500">Adresse *</label>
                <input
                  type="text"
                  placeholder="Ex: Cocody Angré, Rue L5"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-brand-dark font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
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

      {/* Delete confirmation modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm"
            onClick={() => setClientToDelete(null)}
          />
          
          {/* Modal box */}
          <div className="relative bg-white border border-gray-100 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex items-center justify-center w-10 h-10 bg-red-50 border border-red-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Supprimer le client</h3>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              {invoices.some((inv) => inv.client_id === clientToDelete.id) ? (
                <>
                  Attention : Le client <span className="font-bold text-brand-dark">{clientToDelete.name}</span> possède des factures enregistrées. Supprimer le client laissera ces factures orphelines. Confirmer la suppression ?
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer définitivement le client <span className="font-bold text-brand-dark">{clientToDelete.name}</span> ? Cette action ne pourra pas être annulée.
                </>
              )}
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-brand-dark hover:bg-gray-50 border border-transparent rounded-xl transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
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
