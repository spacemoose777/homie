"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, Plus, Minus } from "lucide-react";
import { subscribeToLedger, addLedgerEntry } from "@/lib/firebase/firestore";
import type { LedgerEntry } from "@/types";

interface BalanceCardProps {
  householdId: string;
  memberUid: string;
  memberName: string;
  canRecordPayouts: boolean;
  currentUid: string;
}

const TYPE_LABEL: Record<LedgerEntry["type"], string> = {
  chore_week: "Weekly clean",
  chore_job: "Paid job",
  payout: "Payout",
  adjustment: "Adjustment",
};

function formatDollars(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${Math.abs(cents / 100).toFixed(2)}`;
}

export default function BalanceCard({
  householdId,
  memberUid,
  memberName,
  canRecordPayouts,
  currentUid,
}: BalanceCardProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return subscribeToLedger(householdId, memberUid, setEntries);
  }, [householdId, memberUid]);

  const balance = useMemo(() => entries.reduce((sum, e) => sum + e.amount, 0), [entries]);

  async function handleRecordPayout() {
    const dollars = parseFloat(payoutAmount || "0");
    if (!dollars || dollars <= 0) return;
    setSaving(true);
    try {
      await addLedgerEntry(householdId, {
        memberUid,
        type: "payout",
        amount: -Math.round(dollars * 100),
        sourceId: null,
        note: payoutNote.trim() || null,
        createdBy: currentUid,
      });
      setPayoutAmount("");
      setPayoutNote("");
      setShowPayoutForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-gray-400" />
          <p className="text-sm text-gray-500">{memberName}'s balance</p>
        </div>
        {canRecordPayouts && (
          <button
            onClick={() => setShowPayoutForm((v) => !v)}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            Record payout
          </button>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-2">{formatDollars(balance)}</p>

      {showPayoutForm && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.50"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="20.00"
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={payoutNote}
            onChange={(e) => setPayoutNote(e.target.value)}
            placeholder="e.g. Paid cash"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRecordPayout}
              disabled={saving || !payoutAmount}
              className="flex-1 py-2 rounded-lg text-white text-xs font-medium disabled:opacity-50"
              style={{ backgroundColor: "#FF6B6B" }}
            >
              <Minus size={11} className="inline mr-1" />
              {saving ? "Recording…" : "Record payout"}
            </button>
            <button
              onClick={() => setShowPayoutForm(false)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="divide-y divide-gray-50 -mx-1">
          {entries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-1 py-2">
              <div className="min-w-0">
                <p className="text-sm text-gray-700">{TYPE_LABEL[entry.type]}</p>
                {entry.note && <p className="text-xs text-gray-400 truncate">{entry.note}</p>}
              </div>
              <span
                className="text-sm font-medium flex-shrink-0 ml-2"
                style={{ color: entry.amount < 0 ? "#f97316" : "#22c55e" }}
              >
                {entry.amount >= 0 && (
                  <Plus size={10} className="inline mb-0.5" />
                )}
                {formatDollars(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
