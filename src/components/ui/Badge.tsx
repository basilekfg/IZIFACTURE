import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { InvoiceStatus } from "@/types/invoice";

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  status?: InvoiceStatus;
}

export default function Badge({
  children,
  className,
  variant = "neutral",
  status,
}: BadgeProps) {
  let badgeText = children;
  let computedVariant = variant;

  if (status) {
    switch (status) {
      case "paid":
        badgeText = "Payée";
        computedVariant = "success";
        break;
      case "sent":
        badgeText = "Envoyée";
        computedVariant = "warning";
        break;
      case "draft":
        badgeText = "Brouillon";
        computedVariant = "neutral";
        break;
      case "overdue":
        badgeText = "En retard";
        computedVariant = "danger";
        break;
      case "cancelled":
        badgeText = "Annulée";
        computedVariant = "neutral";
        break;
    }
  }

  const baseStyles = "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all duration-200";
  
  const variantStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    primary: "bg-emerald-500 text-white border-emerald-600",
  };

  // Add dot indicator for status badges
  const hasDot = status !== undefined;

  return (
    <span
      className={twMerge(
        clsx(baseStyles, variantStyles[computedVariant], className)
      )}
    >
      {hasDot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            computedVariant === "success" && "bg-emerald-500",
            computedVariant === "warning" && "bg-amber-500",
            computedVariant === "danger" && "bg-red-500",
            computedVariant === "neutral" && "bg-gray-400",
            computedVariant === "info" && "bg-blue-500"
          )}
        />
      )}
      {badgeText}
    </span>
  );
}
