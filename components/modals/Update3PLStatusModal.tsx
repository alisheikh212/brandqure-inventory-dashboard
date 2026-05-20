"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { InventoryRow } from "@/lib/mock-data";

type ThreePLStatus = "Processing" | "Shipped" | "Arrived" | "On Hold";

interface Update3PLStatusModalProps {
  row: InventoryRow;
  onClose: () => void;
}

const STATUS_OPTIONS: ThreePLStatus[] = [
  "Processing",
  "Shipped",
  "Arrived",
  "On Hold",
];

export default function Update3PLStatusModal({
  row,
  onClose,
}: Update3PLStatusModalProps) {
  const [location, setLocation] = useState(row.threePlLocation);
  const [status, setStatus] = useState<ThreePLStatus>("Processing");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 1: local state only — no backend
    console.log("Update 3PL Status (mock):", {
      sku: row.sku,
      location,
      status,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      title="Update 3PL Status"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant hover:border-outline transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="update-3pl-form"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg btn-primary-teal font-label-md text-label-md focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              sync_alt
            </span>
            Update 3PL
          </button>
        </>
      }
    >
      <form
        id="update-3pl-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        {/* SKU Name (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-md text-label-md text-on-surface-variant">
            SKU Name
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
              inventory_2
            </span>
            <input
              type="text"
              value={row.sku}
              readOnly
              className="brand-input pl-10"
            />
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {row.productName}
          </p>
        </div>

        {/* 3PL Location */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface-variant"
            htmlFor="3pl-location"
          >
            Current 3PL Location
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none">
              warehouse
            </span>
            <input
              id="3pl-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="brand-input pl-10"
              placeholder="Warehouse name and location"
            />
          </div>
        </div>

        {/* New Status */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface-variant"
            htmlFor="new-status"
          >
            New Status
          </label>
          <div className="relative">
            <select
              id="new-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ThreePLStatus)}
              className="brand-input appearance-none cursor-pointer pr-10"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface-variant flex justify-between"
            htmlFor="notes"
          >
            <span>Notes</span>
            <span className="font-normal text-outline">Optional</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add tracking identifiers or processing remarks..."
            className="w-full px-4 py-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none transition-all resize-none placeholder:text-outline/70"
          />
        </div>
      </form>
    </Modal>
  );
}
