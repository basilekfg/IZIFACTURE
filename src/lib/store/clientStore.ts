import { create } from "zustand";
import { Client } from "@/types/invoice";
import { supabase } from "@/lib/supabase";

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">) => Promise<string>;
  updateClient: (id: string, updated: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  loading: false,
  error: null,
  
  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ clients: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  addClient: async (newClient) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const createdId = `client-${Date.now()}`;
      const { data, error } = await supabase
        .from("clients")
        .insert({
          id: createdId,
          user_id: user.id,
          name: newClient.name,
          phone: newClient.phone,
          address: newClient.address,
        })
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({ 
        clients: [data, ...state.clients],
        loading: false 
      }));
      return createdId;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  updateClient: async (id, updatedFields) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from("clients")
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id) // Ensure security check
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        clients: state.clients.map((client) => 
          client.id === id ? data : client
        ),
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  deleteClient: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Ensure security check

      if (error) throw error;

      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        loading: false
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
