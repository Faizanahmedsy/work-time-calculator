"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

/**
 * ThemeDialog - A themed dialog component with consistent styling across the app
 *
 * This component wraps the shadcn Dialog with the app's custom glassmorphism design
 *
 * @param {object} props - Component props
 * @param {boolean} props.open - Controls whether the dialog is open
 * @param {function} props.onOpenChange - Callback function when dialog open state changes
 * @param {string} props.title - Dialog title text
 * @param {string} [props.description] - Optional dialog description text
 * @param {React.ReactNode} props.children - Dialog content
 * @param {React.ReactNode} [props.footer] - Optional footer content
 * @param {string} [props.contentClassName] - Additional classes for DialogContent
 * @param {string} [props.titleClassName] - Additional classes for DialogTitle
 *
 * @example
 * <ThemeDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Work Time Settings"
 *   description="Configure your work time preferences"
 *   footer={<Button onClick={handleSave}>Save</Button>}
 * >
 *   <div>Dialog content goes here</div>
 * </ThemeDialog>
 */
export const ThemeDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
  titleClassName,
  descriptionClassName,
  ...props
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent
        className={cn(
          "bg-gray-800/10 backdrop-blur-md border border-gray-700 text-white rounded-3xl",
          contentClassName
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn("text-xl font-semibold text-white", titleClassName)}
          >
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription
              className={cn("text-gray-300", descriptionClassName)}
            >
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

/**
 * ThemeDialogFooter - A footer component for ThemeDialog
 *
 * Use this when you need more control over footer layout
 *
 * @example
 * <ThemeDialog title="Confirm Delete">
 *   <p>Are you sure?</p>
 *   <ThemeDialogFooter>
 *     <ThemeButton variant="outline" onClick={onCancel}>Cancel</ThemeButton>
 *     <ThemeButton variant="destructive" onClick={onConfirm}>Delete</ThemeButton>
 *   </ThemeDialogFooter>
 * </ThemeDialog>
 */
export const ThemeDialogFooter = DialogFooter;
