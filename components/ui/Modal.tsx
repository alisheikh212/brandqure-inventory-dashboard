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
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border border-outline-variant/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/40">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-tertiary-fixed-variant">
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
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-on-tertiary-fixed-variant/50"
          >
            <span className="material-symbols-outlined text-[20px]">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-5">{children}</div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-outline-variant/40 bg-surface-bright/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
          {footer}
        </div>
      </div>
    </div>
  );
}
