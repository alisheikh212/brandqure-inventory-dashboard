"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary-indigo font-label-md text-label-md"
    >
      <span className="material-symbols-outlined text-[18px]">print</span>
      Print / Save PDF
    </button>
  );
}
