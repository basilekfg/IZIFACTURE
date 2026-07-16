import { create } from "zustand";
import { Invoice, InvoiceStatus, InvoiceItem } from "@/types/invoice";
import { supabase } from "@/lib/supabase";

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "user_id" | "created_at" | "updated_at">) => Promise<string>;
  updateInvoice: (id: string, updated: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,
  
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("invoices")
        .select("*, items:invoice_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Ensure numeric types from PG are converted to standard JS numbers
      const todayStr = new Date().toISOString().split("T")[0];
      const formattedInvoices = (data || []).map((inv: any) => {
        let status = inv.status;
        if (status === "sent" && inv.due_date && inv.due_date < todayStr) {
          status = "overdue";
          // Silent background update to Supabase to keep db in sync
          supabase
            .from("invoices")
            .update({ status: "overdue", updated_at: new Date().toISOString() })
            .eq("id", inv.id)
            .then(({ error }) => {
              if (error) console.error("Error auto-updating status to overdue:", error);
            });
        }
        return {
          ...inv,
          status,
          subtotal: Number(inv.subtotal),
          tax_rate: Number(inv.tax_rate),
          tax_amount: Number(inv.tax_amount),
          total: Number(inv.total),
          amount_paid: Number(inv.amount_paid),
          items: (inv.items || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: Number(item.total),
          })).sort((a: InvoiceItem, b: InvoiceItem) => a.sort_order - b.sort_order),
        };
      });

      set({ invoices: formattedInvoices, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  addInvoice: async (newInvoice) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const newId = `inv-${Date.now()}`;
      
      // 1. Insert invoice header
      const { error: invError } = await supabase
        .from("invoices")
        .insert({
          id: newId,
          user_id: user.id,
          client_id: newInvoice.client_id,
          invoice_number: newInvoice.invoice_number,
          status: newInvoice.status,
          issue_date: newInvoice.issue_date,
          due_date: newInvoice.due_date,
          subtotal: newInvoice.subtotal,
          tax_rate: newInvoice.tax_rate,
          tax_amount: newInvoice.tax_amount,
          total: newInvoice.total,
          amount_paid: newInvoice.amount_paid,
          payment_method: newInvoice.payment_method,
          paid_at: newInvoice.paid_at,
        });

      if (invError) throw invError;

      // 2. Insert invoice items if any
      let createdItems: InvoiceItem[] = [];
      if (newInvoice.items && newInvoice.items.length > 0) {
        const itemsToInsert = newInvoice.items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          invoice_id: newId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          sort_order: item.sort_order ?? idx,
        }));

        const { data: insertedItems, error: itemsError } = await supabase
          .from("invoice_items")
          .insert(itemsToInsert)
          .select();

        if (itemsError) throw itemsError;
        createdItems = (insertedItems || []).map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total: Number(item.total),
        }));
      }

      // 3. Update local state
      const createdInvoice: Invoice = {
        ...newInvoice,
        id: newId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: createdItems,
      };

      set((state) => ({
        invoices: [createdInvoice, ...state.invoices],
        loading: false
      }));

      return newId;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  updateInvoice: async (id, updatedFields) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // 1. Update invoice header
      const { error: invError } = await supabase
        .from("invoices")
        .update({
          client_id: updatedFields.client_id,
          invoice_number: updatedFields.invoice_number,
          status: updatedFields.status,
          issue_date: updatedFields.issue_date,
          due_date: updatedFields.due_date,
          subtotal: updatedFields.subtotal,
          tax_rate: updatedFields.tax_rate,
          tax_amount: updatedFields.tax_amount,
          total: updatedFields.total,
          amount_paid: updatedFields.amount_paid,
          payment_method: updatedFields.payment_method,
          paid_at: updatedFields.paid_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id); // Ensure security check

      if (invError) throw invError;

      // 2. Manage items (re-create them to handle additions, updates and deletions easily)
      let updatedItems: InvoiceItem[] = [];
      if (updatedFields.items) {
        // Delete all old items
        const { error: deleteError } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", id);

        if (deleteError) throw deleteError;

        // Insert new/updated items
        if (updatedFields.items.length > 0) {
          const itemsToInsert = updatedFields.items.map((item, idx) => ({
            id: item.id && !item.id.startsWith("item-init") && !item.id.includes(Date.now().toString())
              ? item.id 
              : `item-${Date.now()}-${idx}`,
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            sort_order: item.sort_order ?? idx,
          }));

          const { data: insertedItems, error: insertError } = await supabase
            .from("invoice_items")
            .insert(itemsToInsert)
            .select();

          if (insertError) throw insertError;
          updatedItems = (insertedItems || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: Number(item.total),
          })).sort((a, b) => a.sort_order - b.sort_order);
        }
      }

      // 3. Update state locally
      set((state) => ({
        invoices: state.invoices.map((inv) => {
          if (inv.id === id) {
            return {
              ...inv,
              ...updatedFields,
              updated_at: new Date().toISOString(),
              items: updatedFields.items ? updatedItems : inv.items,
            };
          }
          return inv;
        }),
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  deleteInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Ensure security check

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  updateInvoiceStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const targetInvoice = get().invoices.find((inv) => inv.id === id);
      if (!targetInvoice) {
        throw new Error("Invoice not found in local store");
      }

      const isPaid = status === "paid";
      const amountPaid = isPaid ? targetInvoice.total : 0;
      const paidAt = isPaid ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("invoices")
        .update({
          status,
          amount_paid: amountPaid,
          paid_at: paidAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id); // Ensure security check

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.map((inv) => 
          inv.id === id 
            ? { 
                ...inv, 
                status, 
                amount_paid: amountPaid,
                paid_at: paidAt,
                updated_at: new Date().toISOString() 
              } 
            : inv
        ),
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
