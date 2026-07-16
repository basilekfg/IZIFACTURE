import { create } from "zustand";
import { CompanySettings } from "@/types/invoice";
import { supabase } from "@/lib/supabase";

interface SettingsState {
  settings: CompanySettings;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (updatedFields: Partial<CompanySettings>) => Promise<void>;
}

const defaultSettings: CompanySettings = {
  id: "settings-1",
  user_id: "user-1",
  company_name: "Boutique Moderne SARL",
  company_email: "contact@boutiquemoderne.ci",
  company_phone: "+225 07 45 67 89 01",
  company_address: "Boulevard de la République",
  company_city: "Abidjan",
  company_country: "Côte d'Ivoire",
  tax_id: "NIF 1-893208-Y",
  logo_url: null,
  invoice_prefix: "FAC",
  invoice_next_number: 6,
  default_payment_terms: 0,
  default_notes: null,
  currency: "XOF",
  tax_rate: 18,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  loading: false,
  error: null,
  
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // 1. Try to fetch settings for this user
      let { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // 2. If no settings exist yet, create default settings for this user
      if (!data) {
        const createdId = `settings-${Date.now()}`;
        const newSettingsData = {
          id: createdId,
          user_id: user.id,
          company_name: user.user_metadata?.company_name || "Mon Entreprise",
          company_email: user.email || "",
          company_phone: "",
          company_address: "",
          company_city: "",
          company_country: "Côte d'Ivoire",
          tax_id: "",
          logo_url: null,
          invoice_prefix: "FAC",
          invoice_next_number: 1,
          default_payment_terms: 0,
          default_notes: null,
          currency: "XOF",
          tax_rate: 18.00,
        };

        const { data: inserted, error: insertError } = await supabase
          .from("company_settings")
          .insert(newSettingsData)
          .select()
          .maybeSingle();

        if (insertError) {
          if (insertError.code === "23505") {
            const { data: refetched, error: refetchError } = await supabase
              .from("company_settings")
              .select("*")
              .eq("user_id", user.id)
              .single();
            if (refetchError) throw refetchError;
            data = refetched;
          } else {
            throw insertError;
          }
        } else if (!inserted) {
          const { data: refetched, error: refetchError } = await supabase
            .from("company_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();
          if (refetchError) throw refetchError;
          data = refetched;
        } else {
          data = inserted;
        }
      }

      const formattedSettings: CompanySettings = {
        ...data,
        tax_rate: Number(data.tax_rate),
        invoice_next_number: Number(data.invoice_next_number),
        default_payment_terms: Number(data.default_payment_terms),
      };

      set({ settings: formattedSettings, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  updateSettings: async (updatedFields) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("company_settings")
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id) // Ensure security check
        .select()
        .single();

      if (error) throw error;

      const formattedSettings: CompanySettings = {
        ...data,
        tax_rate: Number(data.tax_rate),
        invoice_next_number: Number(data.invoice_next_number),
        default_payment_terms: Number(data.default_payment_terms),
      };

      set({ settings: formattedSettings, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
