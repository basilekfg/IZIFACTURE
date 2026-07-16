"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useClientStore } from "@/lib/store/clientStore";
import { useInvoiceStore } from "@/lib/store/invoiceStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchClients = useClientStore((state) => state.fetchClients);
  const fetchInvoices = useInvoiceStore((state) => state.fetchInvoices);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  const clientsLoading = useClientStore((state) => state.loading);
  const invoicesLoading = useInvoiceStore((state) => state.loading);
  const settingsLoading = useSettingsStore((state) => state.loading);

  useEffect(() => {
    let active = true;

    async function checkAuthAndLoad() {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (active) {
          router.push("/login");
        }
        return;
      }

      if (active) {
        setAuthLoading(false);
        try {
          await Promise.all([
            fetchClients(),
            fetchInvoices(),
            fetchSettings(),
          ]);
        } catch (err) {
          console.error("Error loading user data:", err);
        } finally {
          if (active) setInitialLoaded(true);
        }
      }
    }

    checkAuthAndLoad();

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (active) {
          setInitialLoaded(false);
          router.push("/login");
        }
      } else if (event === "SIGNED_IN" && session) {
        if (active) {
          setAuthLoading(false);
          try {
            await Promise.all([
              fetchClients(),
              fetchInvoices(),
              fetchSettings(),
            ]);
          } catch (err) {
            console.error("Error loading user data on sign in:", err);
          } finally {
            if (active) setInitialLoaded(true);
          }
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, fetchClients, fetchInvoices, fetchSettings]);

  const showLoader = authLoading || (!initialLoaded && (clientsLoading || invoicesLoading || settingsLoading));

  if (showLoader) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4 p-8 bg-white border border-gray-100 rounded-2xl shadow-sm max-w-sm text-center">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-light text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-brand-dark mt-2">Chargement de IZI Facture</h2>
          <p className="text-xs text-gray-500">Connexion sécurisée en cours avec votre base de données Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar navigation and utilities */}
        <Topbar onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8F9FA]">
          {children}
        </main>
      </div>
    </div>
  );
}


