"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { InventoryRow } from "@/lib/mock-data";

interface AddOrderedUnitsModalProps {
  row: InventoryRow;
  inventory: InventoryRow[];
  onClose: () => void;
}

export default function AddOrderedUnitsModal({
  row,
  inventory,
  onClose,
}: AddOrderedUnitsModalProps) {
  const [selectedSku, setSelectedSku] = useState(row.sku);
  const [poNumber, setPoNumber] = useState("");
  const [units, setUnits] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 1: local state only — no backend
    console.log("Add Ordered Units (mock):", {
      sku: selectedSku,
      poNumber,
      units,
      arrivalDate,
    });
    onClose();
  };

  return (
    <Modal
      title="Add Ordered Units"
      icon="inventory_2"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-outline-variant bg-transparent text-on-surface font-label-md text-label-md transition-all hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-outline/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-units-form"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg btn-primary-indigo font-label-md text-label-md focus:outline-none focus:ring-2 focus:ring-on-tertiary-fixed-variant focus:ring-offset-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_task
            </span>
            Add to Timeline
          </button>
        </>
      }
    >
      <form
        id="add-units-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        {/* SKU Selection */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface"
            htmlFor="sku-select"
          >
            SKU Selection
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
              search
            </span>
            <select
              id="sku-select"
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="brand-input pl-10 appearance-none cursor-pointer"
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.sku}>
                  {item.sku} — {item.productName}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* PO Number + Units (2-column) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              className="font-label-md text-label-md text-on-surface"
              htmlFor="po-number"
            >
              PO Number
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                receipt_long
              </span>
              <input
                id="po-number"
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2024-089"
                className="brand-input pl-10"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="font-label-md text-label-md text-on-surface"
              htmlFor="units-ordered"
            >
              Units Ordered
            </label>
            <div className="relative">
              <input
                id="units-ordered"
                type="number"
                min={1}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="0"
                className="brand-input pr-12 text-right font-numeric-data"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-outline-variant pointer-events-none">
                PCS
              </span>
            </div>
          </div>
        </div>

        {/* Expected Arrival Date */}
        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface"
            htmlFor="arrival-date"
          >
            Expected Arrival Date
          </label>
          <input
            id="arrival-date"
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            className="brand-input"
            required
          />
          <p className="font-label-sm text-label-sm text-outline">
            This will plot the incoming inventory on your forecasting timeline.
          </p>
        </div>
      </form>
    </Modal>
  );
}
