"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSettingsStore } from "@/lib/store/settingsStore";

interface TopbarProps {
  onOpenSidebar: () => void;
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const pathname = usePathname();
  const { settings } = useSettingsStore();

  // Generate page titles and breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    if (!pathname) return [{ label: "Tableau de bord", href: "/dashboard" }];
    
    const parts = pathname.split("/").filter(Boolean);
    const crumbs = [];
    
    // Default homecrumb
    crumbs.push({ label: "Accueil", href: "/dashboard" });
    
    let currentPath = "";
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      // Don't duplicate dashboard since we mapped it to Accueil
      if (part === "dashboard" && index === 0) return;
      
      let label = part;
      if (part === "invoices") label = "Factures";
      else if (part === "clients") label = "Clients";
      else if (part === "settings") label = "Paramètres";
      else if (part === "new") label = "Nouvelle facture";
      else if (part === "edit") label = "Modifier";
      else if (part.match(/^[0-9a-f-]{36}$/i)) label = `Détail`; // UUID detection
      
      crumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: currentPath,
      });
    });
    
    return crumbs;
  };

  const crumbs = getBreadcrumbs();
  const pageTitle = crumbs[crumbs.length - 1]?.label || "Tableau de bord";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white border-b border-gray-100 shadow-sm shadow-gray-100/10">
      {/* Left side: Hamburger button + Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger menu */}
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-brand-dark hover:bg-gray-50 lg:hidden transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Breadcrumb navigation */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-400">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <React.Fragment key={crumb.href + index}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                {isLast ? (
                  <span className="text-gray-800 font-semibold">{crumb.label}</span>
                ) : (
                  <Link 
                    href={crumb.href}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Mobile Title (only visible on small screen) */}
        <span className="sm:hidden text-lg font-bold text-gray-800">
          {pageTitle}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="/settings"
          className="flex items-center gap-3 bg-gray-50/80 hover:bg-emerald-50 px-3 py-1.5 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-all duration-200 cursor-pointer group"
        >
          <div className="hidden sm:block text-right">
            <span className="block text-sm font-bold text-gray-800 group-hover:text-emerald-900 transition-colors">{settings.company_name}</span>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
            {settings.company_name.substring(0, 2).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
}
