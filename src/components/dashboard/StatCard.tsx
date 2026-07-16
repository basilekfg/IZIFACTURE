import React from "react";
import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  color?: "emerald" | "amber" | "red" | "blue";
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = "neutral",
  color = "emerald",
  subtitle,
}: StatCardProps) {
  const colorSchemes = {
    emerald: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      accent: "text-amber-600",
    },
    red: {
      bg: "bg-red-50 text-red-600 border-red-100",
      accent: "text-red-600",
    },
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "text-blue-600",
    },
  };

  const activeColor = colorSchemes[color];

  return (
    <div className="flex flex-col p-6 bg-white rounded-2xl border border-gray-100 shadow-md shadow-gray-200/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-300/50 hover:-translate-y-0.5 group">
      <div className="flex items-center justify-between">
        {/* Title */}
        <span className="text-sm font-medium text-gray-500">{title}</span>
        
        {/* Icon wrapper */}
        <div className={clsx("flex items-center justify-center w-12 h-12 rounded-xl border transition-all duration-300 group-hover:scale-105", activeColor.bg)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Main value */}
      <div className="mt-4">
        <h3 className="text-2xl font-bold tracking-tight text-brand-dark">
          {value}
        </h3>
        
        {/* Dynamic Period/Scope Subtitle */}
        {subtitle && (
          <p className="text-[10px] text-gray-400 font-medium mt-1 leading-normal">
            {subtitle}
          </p>
        )}
        
        {/* Trend indicators */}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={clsx(
                "inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                trendDirection === "up" && "bg-emerald-50 text-emerald-700",
                trendDirection === "down" && "bg-red-50 text-red-700",
                trendDirection === "neutral" && "bg-gray-50 text-gray-700"
              )}
            >
              {trendDirection === "up" && "↑"}
              {trendDirection === "down" && "↓"}
              {trend}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              par rapport au mois dernier
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
