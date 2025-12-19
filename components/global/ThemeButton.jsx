"use client";

import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

/**
 * ThemeButton - A themed button component with consistent styling variants
 *
 * This component wraps the shadcn Button with the app's custom styling variants
 *
 * @param {object} props - Component props
 * @param {('primary'|'secondary'|'outline'|'destructive'|'ghost')} [props.variant='primary'] - Button style variant
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {boolean} [props.fullRounded=true] - Whether to apply full rounded corners (rounded-full)
 *
 * Variants:
 * - primary: Cyan background (main action button)
 * - secondary/outline: Outlined with gray border (cancel/secondary actions)
 * - destructive: Red background (delete/dangerous actions)
 * - ghost: Transparent background (icon buttons, subtle actions)
 *
 * @example
 * <ThemeButton variant="primary" onClick={handleSave}>
 *   Save Settings
 * </ThemeButton>
 *
 * <ThemeButton variant="destructive" onClick={handleDelete}>
 *   Delete All
 * </ThemeButton>
 *
 * <ThemeButton variant="outline" onClick={handleCancel}>
 *   Cancel
 * </ThemeButton>
 */
export const ThemeButton = ({
  variant = "primary",
  className,
  children,
  fullRounded = true,
  ...props
}) => {
  // Define variant-specific styles
  const variantStyles = {
    primary: "bg-cyan-900 hover:bg-cyan-600 text-cyan-200",
    secondary: "text-gray-300 border-gray-600 hover:bg-gray-700",
    outline: "text-gray-300 border-gray-600 hover:bg-gray-700",
    destructive: "bg-red-600 hover:bg-red-700 text-rose-100",
    ghost: "text-white hover:bg-gray-700/40",
  };

  // Get the style for the selected variant
  const selectedVariantStyle = variantStyles[variant] || variantStyles.primary;

  // Determine the shadcn variant to use
  // Map our variants to shadcn's variants
  const shadcnVariant =
    variant === "destructive"
      ? "destructive"
      : variant === "outline" || variant === "secondary"
      ? "outline"
      : variant === "ghost"
      ? "ghost"
      : "default";

  return (
    <Button
      variant={shadcnVariant}
      className={cn(
        selectedVariantStyle,
        fullRounded && "rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
