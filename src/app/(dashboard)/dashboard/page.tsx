"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  Clock, 
  AlertTriangle, 
  FileEdit, 
  Plus, 
  Users, 
  FileText, 
  ArrowUpRight,
  Download,
  Calendar,
  Sparkles
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import Badge from "@/components/ui/Badge";
import { formatFCFA, formatDate } from "@/lib/utils/format";
import { useInvoiceStore } from "@/lib/store/invoiceStore";
import { useClientStore } from "@/lib/store/clientStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import Link from "next/link";

export default function DashboardPage() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const invoices = useInvoiceStore((state) => state.invoices);
  const clients = useClientStore((state) => state.clients);
  const settings = useSettingsStore((state) => state.settings);

  // Date picker states
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>("2026-12-31");

  const formatYAxisVal = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + "k";
    }
    return String(Math.round(val));
  };

  // Filter invoices dynamically based on date range selection
  const filteredInvoices = invoices.filter((inv) => {
    if (!inv.issue_date) return false;
    const invDate = new Date(inv.issue_date);
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");
    return invDate >= start && invDate <= end;
  });

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bonjour" : "Bonsoir";

  // 1. Calculate KPI Stats dynamically from the filtered store
  const totalPaid = filteredInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalSent = filteredInvoices
    .filter((inv) => inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalOverdue = filteredInvoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalDraft = filteredInvoices
    .filter((inv) => inv.status === "draft")
    .reduce((sum, inv) => sum + inv.total, 0);

  // 2. Compute dynamic chart data based on live store data (last 6 months glissants)
  const getLast6Months = () => {
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString("fr-FR", { month: "short" });
      const label = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(".", "");
      result.push({
        label,
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        x: 40 + (5 - i) * 96, // Spread 6 points evenly across x coordinates: 40, 136, 232, 328, 424, 520
      });
    }
    return result;
  };

  const months = getLast6Months();

  const getMonthlyPaidRevenue = (monthIndex: number, year: number) => {
    // Filter invoices by month and year (unfiltered by date picker)
    return invoices
      .filter((inv) => {
        if (inv.status !== "paid") return false;
        const date = new Date(inv.issue_date);
        return date.getFullYear() === year && date.getMonth() === monthIndex;
      })
      .reduce((sum, inv) => sum + inv.total, 0);
  };

  const maxRevenue = Math.max(...months.map((m) => getMonthlyPaidRevenue(m.monthIndex, m.year)), 100000);

  const getSVGCoordinateY = (revenue: number) => {
    const minY = 150;
    const maxY = 40;
    if (revenue === 0) return minY;
    const ratio = revenue / maxRevenue;
    return Math.round(minY - ratio * (minY - maxY));
  };

  const chartData = months.map((m) => {
    const revenue = getMonthlyPaidRevenue(m.monthIndex, m.year);
    return {
      month: m.label,
      revenue,
      x: m.x,
      y: getSVGCoordinateY(revenue),
    };
  });

  // 3. Compute semester performance percentage (last 6 months vs. previous 6 months)
  const getSemesterPerformance = () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const currentSemesterRevenue = invoices
      .filter((inv) => {
        if (inv.status !== "paid") return false;
        const date = new Date(inv.issue_date);
        return date >= sixMonthsAgo;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const previousSemesterRevenue = invoices
      .filter((inv) => {
        if (inv.status !== "paid") return false;
        const date = new Date(inv.issue_date);
        return date >= twelveMonthsAgo && date < sixMonthsAgo;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    let percent = 0;
    let isPositive = true;

    if (previousSemesterRevenue > 0) {
      percent = ((currentSemesterRevenue - previousSemesterRevenue) / previousSemesterRevenue) * 100;
      isPositive = percent >= 0;
    } else if (currentSemesterRevenue > 0) {
      percent = 100;
      isPositive = true;
    } else {
      percent = 0;
      isPositive = true;
    }

    return {
      percent: Math.abs(percent),
      isPositive,
    };
  };

  const performance = getSemesterPerformance();

  // SVG dimensions
  const width = 560;
  const height = 180;

  // Generate SVG Path for line chart
  const pathD = chartData.reduce((acc, point, index) => {
    return index === 0 
      ? `M ${point.x} ${point.y}` 
      : `${acc} L ${point.x} ${point.y}`;
  }, "");

  // Generate SVG Path for shaded area under the curve
  const areaD = `${pathD} L ${chartData[chartData.length - 1].x} 170 L ${chartData[0].x} 170 Z`;

  // Get the 5 most recent invoices with mapped clients
  const recentInvoices = filteredInvoices.slice(0, 5).map((inv) => ({
    ...inv,
    clientObj: clients.find((c) => c.id === inv.client_id) || null,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section with greetings */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-dark flex items-center gap-2">
            {greeting}, {settings.company_name} <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Voici un aperçu de l&apos;activité de votre entreprise aujourd&apos;hui.
          </p>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-white border border-primary/50 p-2 rounded-2xl shadow-md shadow-emerald-500/5 hover:border-primary transition-all duration-300">
          <Calendar className="w-4.5 h-4.5 text-gray-400 ml-1 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Du</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Au</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'affaires payé"
          value={formatFCFA(totalPaid)}
          icon={TrendingUp}
          color="emerald"
          subtitle="sur la période sélectionnée"
        />
        <StatCard
          title="Factures envoyées (attente)"
          value={formatFCFA(totalSent)}
          icon={Clock}
          color="amber"
          subtitle="sur la période sélectionnée"
        />
        <StatCard
          title="Factures en retard"
          value={formatFCFA(totalOverdue)}
          icon={AlertTriangle}
          color="red"
          subtitle="sur la période sélectionnée"
        />
        <StatCard
          title="Factures en brouillon"
          value={formatFCFA(totalDraft)}
          icon={FileEdit}
          color="blue"
          subtitle="sur la période sélectionnée"
        />
      </div>

      {/* Main Content Sections: Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Chart & Table of Invoices (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Revenue Chart Card */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-md shadow-gray-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-800">Évolution mensuelle des revenus</h3>
                <p className="text-xs text-gray-400 mt-0.5">Activité du chiffre d&apos;affaires sur les 6 derniers mois</p>
              </div>
              {performance.isPositive ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100" title="Par rapport au semestre précédent">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{performance.percent.toFixed(1)}% ce semestre
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-full border border-red-100" title="Par rapport au semestre précédent">
                  <TrendingDown className="w-3.5 h-3.5" />
                  -{performance.percent.toFixed(1)}% ce semestre
                </div>
              )}
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="relative w-full h-[200px] mt-4 flex items-center justify-center">
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-full overflow-visible"
              >
                <defs>
                  {/* Premium Emerald Green Gradient for the Shaded Area */}
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C853" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#00C853" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="40" y1="40" x2="520" y2="40" stroke="#F3F4F6" strokeWidth={1} strokeDasharray="4 4" />
                <line x1="40" y1="85" x2="520" y2="85" stroke="#F3F4F6" strokeWidth={1} strokeDasharray="4 4" />
                <line x1="40" y1="130" x2="520" y2="130" stroke="#F3F4F6" strokeWidth={1} strokeDasharray="4 4" />
                <line x1="40" y1="170" x2="520" y2="170" stroke="#E5E7EB" strokeWidth={1.5} />

                {/* Y-axis Amount Labels */}
                <text x="24" y="40" dy="0.32em" textAnchor="end" className="text-[9px] font-bold fill-gray-400 font-sans">{formatYAxisVal(maxRevenue)}</text>
                <text x="24" y="85" dy="0.32em" textAnchor="end" className="text-[9px] font-bold fill-gray-400 font-sans">{formatYAxisVal(maxRevenue / 2)}</text>
                <text x="24" y="130" dy="0.32em" textAnchor="end" className="text-[9px] font-bold fill-gray-400 font-sans">{formatYAxisVal(maxRevenue / 4)}</text>
                <text x="24" y="170" dy="0.32em" textAnchor="end" className="text-[9px] font-bold fill-gray-400 font-sans">0</text>

                {/* Shaded Area under the curve */}
                <path d={areaD} fill="url(#chartGradient)" className="transition-all duration-500" />

                {/* Curve Line */}
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="#00C853" 
                  strokeWidth={3} 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />

                {/* Interactive Points/Markers */}
                {chartData.map((point, index) => (
                  <g key={point.month}>
                    {/* Month Axis Label */}
                    <text 
                      x={point.x} 
                      y="178" 
                      textAnchor="middle" 
                      className="text-[10px] font-semibold fill-gray-400 font-sans"
                    >
                      {point.month}
                    </text>

                    {/* Point Circle */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={hoveredPoint === index ? 6 : 4}
                      fill={hoveredPoint === index ? "#00A844" : "#00C853"}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      className="cursor-pointer transition-all duration-150 shadow"
                      onMouseEnter={() => setHoveredPoint(index)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Simple Tooltip on Point Hover */}
                    {hoveredPoint === index && (
                      <g>
                        {/* Tooltip background card */}
                        <rect
                          x={point.x - 65}
                          y={point.y - 38}
                          width={130}
                          height={28}
                          rx={6}
                          fill="#1A1A2E"
                          className="shadow-lg filter drop-shadow-md"
                        />
                        {/* Tooltip value */}
                        <text
                          x={point.x}
                          y={point.y - 20}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          className="text-[9px] font-bold font-sans"
                        >
                          {formatFCFA(point.revenue)}
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>
            </div>
            
            {/* Legend info */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-50 text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                Chiffre d&apos;Affaires payé
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Quick Actions & Quick Stats (1/3 width) */}
        <div className="space-y-8">
          
          {/* Quick Actions Panel */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-md shadow-gray-200/50">
            <h3 className="text-base font-bold text-gray-800 mb-4">Raccourcis rapides</h3>
            
            <div className="grid grid-cols-1 gap-3.5">
              <Link 
                href="/invoices/new"
                className="flex items-center gap-3.5 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-300 group shadow-inner"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-gray-700 group-hover:text-emerald-950">Créer une facture</span>
                  <span className="block text-[11px] text-gray-400 font-normal">Calcul TVA automatique</span>
                </div>
              </Link>

              <Link 
                href="/clients?new=true"
                className="flex items-center gap-3.5 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-300 group shadow-inner"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-gray-700 group-hover:text-emerald-950">Ajouter un client</span>
                  <span className="block text-[11px] text-gray-400 font-normal">Suivi CRM et contact</span>
                </div>
              </Link>


            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Card (Full width) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-md shadow-gray-200/50 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-800">Factures récentes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Suivi des derniers encaissements et relances émis</p>
          </div>
          <Link 
            href="/invoices"
            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group"
          >
            Voir tout
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150">
                <th className="px-6 py-4">Facture</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date d&apos;émission</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium">
              {recentInvoices.map((inv) => (
                <tr 
                  key={inv.id}
                  className="hover:bg-gray-50/50 transition-colors group/row"
                >
                  <td className="px-6 py-4 text-brand-dark font-bold">
                    <Link href={`/invoices/${inv.id}`} className="hover:text-primary transition-colors hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Client Initial Avatar */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs">
                        {inv.clientObj?.name.split(" ").map(n => n[0]).join("") || "FC"}
                      </div>
                      <div>
                        <span className="block text-gray-800 font-semibold">{inv.clientObj?.name || "Client supprimé"}</span>
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
                        className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition-all duration-200"
                      >
                        Détails
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
          {recentInvoices.map((inv) => {
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
      </div>
    </div>
  );
}
