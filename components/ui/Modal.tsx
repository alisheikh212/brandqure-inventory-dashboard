"use client";

import { useEffect } from "react";

interface ModalProps {
  title: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function Modal({
  title,
  icon,
  onClose,
  children,
  footer,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/25 backdrop-blur-md p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg glass-modal flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/35">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-white/60 border border-white/50 shadow-sm flex items-center justify-center text-on-tertiary-fixed-variant">
                <span className="material-symbols-outlined text-[20px]">
                  {icon}
                </span>
              </div>
            )}
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-white/60 hover:text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-on-tertiary-fixed-variant/40"
          >
            <span className="material-symbols-outlined text-[20px]">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-5">{children}</div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/35 bg-white/25 flex flex-col-reverse sm:flex-row justify-end gap-3">
          {footer}
        </div>
      </div>
    </div>
  );
}
