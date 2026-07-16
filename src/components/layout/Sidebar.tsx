"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  X
} from "lucide-react";
import { clsx } from "clsx";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Factures", href: "/invoices", icon: FileText },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-brand-dark/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar text-white transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-sidebar-active/30",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-sidebar-active/30">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            {/* Elegant SVG Logo inspired by screenshots */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white shadow-md shadow-emerald-950/20">
              <svg 
                className="w-5 h-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                IZI Facture
              </span>
              <span className="block text-[10px] text-emerald-300 font-semibold tracking-wider uppercase -mt-0.5">
                Facturer en un clic
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-sidebar-hover lg:hidden transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-6 h-6 text-emerald-100" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-white/10 text-white shadow-inner font-semibold"
                    : "text-emerald-100/80 hover:text-white hover:bg-white/5"
                )}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 rounded-r bg-primary" />
                )}
                
                <item.icon 
                  className={clsx(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : "text-emerald-200/60 group-hover:text-emerald-100"
                  )} 
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile card & Logout */}
        <div className="p-4 border-t border-sidebar-active/30 bg-sidebar-active/20">

          <button 
            className="flex items-center justify-center w-full gap-2.5 px-4 py-2.5 mt-2 text-xs font-semibold text-emerald-200/60 hover:text-white hover:bg-white/5 rounded-xl border border-emerald-800/40 hover:border-emerald-700/60 transition-all duration-200"
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600 mb-3 animate-pulse">
                <LogOut className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirmation</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Êtes-vous sûr de vouloir vous déconnecter de votre compte IZI Facture ?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95 text-center"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsLogoutModalOpen(false);
                    await supabase.auth.signOut();
                    router.push("/login");
                  } catch (err: any) {
                    alert("Erreur lors de la déconnexion: " + err.message);
                  }
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200 active:scale-95 text-center shadow-lg shadow-red-500/10"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
