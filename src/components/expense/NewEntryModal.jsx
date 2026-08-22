import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";

function NewEntryModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [owedAmount, setOwedAmount] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const totalAmount = Number(amount);
  const roommateOwed = Number(owedAmount);

  const yourShare =
    totalAmount > 0 && roommateOwed >= 0 ? totalAmount - roommateOwed : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // -----------------------------
    // Validation
    // -----------------------------

    if (!amount || totalAmount <= 0) {
      setError("Please enter a valid total amount.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason for the expense.");
      return;
    }

    if (!owedAmount || roommateOwed <= 0) {
      setError("Please enter a valid amount owed by your roommate.");
      return;
    }

    if (roommateOwed > totalAmount) {
      setError("The amount owed cannot be greater than the total amount.");
      return;
    }

    try {
      setLoading(true);

      // Get current authenticated user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("Not authenticated");

      // Find a roommate/profile other than current user (simple two-person assumption)
      const { data: otherProfiles, error: profErr } = await supabase
        .from("profiles")
        .select("id")
        .neq("id", user.id)
        .limit(1);

      if (profErr) throw profErr;
      if (!otherProfiles || otherProfiles.length === 0)
        throw new Error("No roommate profile found");

      const roommateId = otherProfiles[0].id;

      const payload = {
        created_by: user.id,
        paid_by: user.id,
        total_amount: totalAmount,
        description: reason.trim(),
        owed_by: roommateId,
        owed_amount: roommateOwed,
        status: "pending_approval",
      };

      const { error: insertErr } = await supabase.from("expenses").insert([payload]);
      if (insertErr) throw insertErr;

      // Reset form
      setAmount("");
      setReason("");
      setOwedAmount("");
      setError("");

      // Tell Dashboard that the entry was successfully added
      onSuccess();
    } catch (err) {
      console.error("Error creating expense:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setAmount("");
    setReason("");
    setOwedAmount("");
    setError("");

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
      onMouseDown={handleClose}
    >
      <div
        className="w-full max-w-[500px] overflow-hidden rounded-xl border border-[#d0ccd0] bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ============================================
            HEADER
        ============================================= */}
        <div className="flex items-start justify-between border-b border-[#e0dde0] px-6 py-5">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-[#1b1b1d]">
              New Expense
            </h2>

            <p className="mt-1 text-[14px] text-[#66636a]">
              Add a new expense paid for you and your roommate.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-[#55535a] transition hover:bg-[#f2eff0] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={21} strokeWidth={2} />
          </button>
        </div>

        {/* ============================================
            FORM
        ============================================= */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {/* TOTAL AMOUNT */}
          <div>
            <label
              htmlFor="expense-amount"
              className="mb-2 block text-[14px] font-semibold text-[#38363b]"
            >
              Total Amount
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[#66636a]">
                ₹
              </span>

              <input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                disabled={loading}
                autoFocus
                className="w-full rounded-md border border-[#c9c6c9] bg-white py-3 pl-9 pr-4 text-[16px] outline-none transition placeholder:text-[#aaa7ab] focus:border-black disabled:bg-[#f5f3f4]"
              />
            </div>
          </div>

          {/* REASON */}
          <div className="mt-5">
            <label
              htmlFor="expense-reason"
              className="mb-2 block text-[14px] font-semibold text-[#38363b]"
            >
              Reason
            </label>

            <input
              id="expense-reason"
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Groceries"
              maxLength={100}
              disabled={loading}
              className="w-full rounded-md border border-[#c9c6c9] bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-[#aaa7ab] focus:border-black disabled:bg-[#f5f3f4]"
            />
          </div>

          {/* ROOMMATE OWES */}
          <div className="mt-5">
            <label
              htmlFor="expense-owed"
              className="mb-2 block text-[14px] font-semibold text-[#38363b]"
            >
              Amount roommate owes you
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[#66636a]">
                ₹
              </span>

              <input
                id="expense-owed"
                type="number"
                min="0"
                step="0.01"
                value={owedAmount}
                onChange={(event) => setOwedAmount(event.target.value)}
                placeholder="0.00"
                disabled={loading}
                className="w-full rounded-md border border-[#c9c6c9] bg-white py-3 pl-9 pr-4 text-[16px] outline-none transition placeholder:text-[#aaa7ab] focus:border-black disabled:bg-[#f5f3f4]"
              />
            </div>

            <p className="mt-2 text-[12px] text-[#77747a]">
              Enter the amount your roommate needs to pay you back.
            </p>
          </div>

          {/* ============================================
              SPLIT SUMMARY
          ============================================= */}
          {totalAmount > 0 && roommateOwed > 0 && (
            <div className="mt-5 rounded-lg bg-[#f7f5f6] px-4 py-4">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#66636a]">Total paid</span>

                <span className="font-medium text-[#29282b]">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[14px]">
                <span className="text-[#66636a]">Roommate owes you</span>

                <span className="font-medium text-[#29282b]">
                  ₹{roommateOwed.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-3 border-t border-[#ddd9dc] pt-3">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-semibold text-[#29282b]">
                    Your share
                  </span>

                  <span className="font-semibold text-[#29282b]">
                    ₹{yourShare.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-4 rounded-md border border-[#f0caca] bg-[#fff4f4] px-4 py-3">
              <p className="text-[13px] font-medium text-[#b42318]">{error}</p>
            </div>
          )}

          {/* ============================================
              BUTTONS
          ============================================= */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-md border border-[#c9c6c9] bg-white px-4 py-3 text-[15px] font-medium text-[#333136] transition hover:bg-[#f5f3f4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center rounded-md bg-black px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewEntryModal;
