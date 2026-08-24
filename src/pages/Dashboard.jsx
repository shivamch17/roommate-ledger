import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Bell,
  LogOut,
  Plus,
  CheckCircle,
  SlidersHorizontal,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { profileAtom } from "../atoms/authAtom";

import NewEntryModal from "../components/expense/NewEntryModal";

function Dashboard() {
  const profile = useAtomValue(profileAtom);

  const [activeTab, setActiveTab] = useState("monthly");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [marking, setMarking] = useState(false);
  const [expenseStatusFilter, setExpenseStatusFilter] = useState("ALL");

  async function loadData() {
    setLoading(true);

    try {
      // Expenses
      const { data: expensesData, error: expErr } = await supabase
        .from("expenses")
        .select(
          `id, created_at, paid_by, owed_by, description, total_amount, owed_amount, status, approved_at`,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (expErr) throw expErr;

      // Settlements (all statuses)
      const { data: settlementsData, error: settleErr } = await supabase
        .from("settlements")
        .select(
          `id, marked_paid_at, paid_by, paid_to, amount, status, confirmed_by, confirmed_at, created_at`,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (settleErr) throw settleErr;

      // Gather profile ids
      const ids = new Set();
      (expensesData || []).forEach((e) => {
        if (e.paid_by) ids.add(e.paid_by);
        if (e.owed_by) ids.add(e.owed_by);
      });
      (settlementsData || []).forEach((s) => {
        if (s.paid_by) ids.add(s.paid_by);
        if (s.paid_to) ids.add(s.paid_to);
      });

      const idArray = Array.from(ids);

      let profilesMap = {};
      if (idArray.length) {
        const { data: profilesData, error: profErr } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", idArray);

        if (profErr) throw profErr;

        profilesMap = Object.fromEntries(
          (profilesData || []).map((p) => [p.id, p.name]),
        );
        setProfiles(profilesData || []);
      }

      setExpenses(
        (expensesData || []).map((e) => ({
          id: e.id,
          date: new Date(e.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          paidBy: profilesMap[e.paid_by] || e.paid_by,
          paid_by_id: e.paid_by,
          owed_by_id: e.owed_by,
          reason: e.description,
          total: Number(e.total_amount),
          owed: Number(e.owed_amount),
          status:
            e.status === "pending_approval"
              ? "PENDING"
              : e.status === "approved"
                ? "APPROVED"
                : e.status === "cleared"
                  ? "CLEARED"
                  : (e.status || "").toUpperCase(),
        })),
      );

      setSettlements(
        (settlementsData || []).map((s) => ({
          id: s.id,
          date: s.marked_paid_at
            ? new Date(s.marked_paid_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
          paid_by_id: s.paid_by,
          paid_to_id: s.paid_to,
          paidBy: profilesMap[s.paid_by] || s.paid_by,
          owedTo: profilesMap[s.paid_to] || s.paid_to,
          amount: Number(s.amount),
          status: (s.status || "").toUpperCase(),
        })),
      );
    } catch (err) {
      console.error("Failed to load dashboard data:", err.message || err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
    }
  };

  // =========================================================
  // NEW ENTRY
  // =========================================================

  const handleNewEntry = () => {
    setIsNewEntryOpen(true);
  };

  // =========================================================
  // MARK CLEAR
  // =========================================================

  const handleMarkClear = async () => {
    if (!profile) return alert("Not signed in");

    setMarking(true);

    try {
      // Compute net between current user and other user (use approved statuses)
      const approvedStatuses = ["APPROVED"];

      let owedToMe = 0;
      let iOwe = 0;
      expenses.forEach((e) => {
        if (approvedStatuses.includes(e.status)) {
          if (e.paid_by_id === profile?.id) owedToMe += e.owed || 0;
          if (e.owed_by_id === profile?.id) iOwe += e.owed || 0;
        }
      });

      const net = owedToMe - iOwe;

      // find counterparty id
      const otherId = (() => {
        const p = profiles.find((p) => p.id !== profile.id);
        if (p) return p.id;
        for (const e of expenses) {
          if (e.paid_by_id && e.paid_by_id !== profile.id) return e.paid_by_id;
          if (e.owed_by_id && e.owed_by_id !== profile.id) return e.owed_by_id;
        }
        return null;
      })();

      if (!otherId) return alert("No counterparty found to settle with");

      // Determine payer: payer should be the one who owes money (net < 0 -> profile owes)
      const payerId = net < 0 ? profile.id : otherId;
      const receiverId = payerId === profile.id ? otherId : profile.id;

      // Only allow current user to create the settlement if they are the payer
      if (payerId !== profile.id) {
        return alert("Only the payer can mark the settlement");
      }

      const amount = Math.abs(net);
      if (amount <= 0) return alert("Nothing to settle");

      const payload = {
        paid_by: payerId,
        paid_to: receiverId,
        amount,
        status: "clearance_pending",
        marked_paid_at: new Date().toISOString(),
      };

      console.log("Creating settlement payload", payload);

      const { error } = await supabase.from("settlements").insert([payload]);
      if (error) throw error;

      alert("Settlement created successfully");

      await loadData();
    } catch (err) {
      console.error("Failed to create settlement:", err.message || err);
      alert("Failed to create settlement: " + (err.message || err));
    } finally {
      setMarking(false);
    }
  };

  const handleConfirmSettlement = async (settlement) => {
    if (!profile) return;
    if (profile.id !== settlement.paid_to_id)
      return console.warn("Only receiver can confirm");

    try {
      const updates = {
        status: "cleared",
        confirmed_by: profile.id,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: settleErr } = await supabase
        .from("settlements")
        .update(updates)
        .eq("id", settlement.id);
      if (settleErr) throw settleErr;

      // Mark related expenses between the two users as cleared
      const userA = settlement.paid_by_id;
      const userB = settlement.paid_to_id;

      const { error: expErr } = await supabase
        .from("expenses")
        .update({
          status: "cleared",
          cleared_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("paid_by", [userA, userB])
        .in("owed_by", [userA, userB])
        .eq("status", "approved");

      if (expErr) throw expErr;

      await loadData();
    } catch (err) {
      console.error("Failed to confirm settlement:", err.message || err);
    }
  };

  // =========================================================
  // APPROVE EXPENSE
  // =========================================================

  const handleApprove = (expenseId) => {
    (async () => {
      try {
        const updates = {
          status: "approved",
          approved_by: profile?.id || null,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("expenses")
          .update(updates)
          .eq("id", expenseId);
        if (error) throw error;

        await loadData();
      } catch (err) {
        console.error("Failed to approve expense:", err.message || err);
      }
    })();
  };

  const handleDeny = (expenseId) => {
    (async () => {
      try {
        const updates = {
          status: "denied",
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("expenses")
          .update(updates)
          .eq("id", expenseId);
        if (error) throw error;

        await loadData();
      } catch (err) {
        console.error("Failed to deny expense:", err.message || err);
      }
    })();
  };

  // =========================================================
  // PROFILE DATA
  // =========================================================

  const displayName = profile?.name || "User";

  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredExpenses =
    expenseStatusFilter === "ALL"
      ? expenses
      : expenses.filter((expense) => expense.status === expenseStatusFilter);

  return (
    <div className="min-h-screen bg-[#fcf8fa] text-[#1b1b1d]">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#d5d1d4] bg-[#fcf8fa]">
        <div className="mx-auto flex max-w-[1250px] items-center justify-between max-sm:px-4 max-sm:py-3 px-6 py-4">
          {/* Logo / Title */}

          <div>
            <h1 className="text-[24px] font-bold tracking-tight">
              Roommate Ledger
            </h1>

            <p className="mt-0.5 text-[14px] text-[#58565c]">
              Simple expense tracking for Vishal & Shivam
            </p>
          </div>

          {/* Header Actions */}

          <div className="flex items-center gap-5">
            {/* Logout */}

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-[#45444a] transition hover:bg-[#f0edef] hover:text-black"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={23} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1250px] max-sm:px-4 max-sm:py-5 px-6 py-7">
        {/* ===================================================
            TOP SECTION
        ==================================================== */}

        <section className="grid grid-cols-1 max-sm:gap-4 gap-5 lg:grid-cols-[1fr_400px]">
          {/* Current Balance */}

          <div className="rounded-xl border border-[#ccc9cc] bg-white max-sm:p-5 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="max-sm:mb-4 mb-5 flex items-start justify-between">
              <p className="text-[16px] font-medium uppercase tracking-wide text-[#58565c]">
                Current Balance
              </p>

              <span className="rounded-sm bg-[#fff0bf] px-3 py-1.5 text-[13px] font-semibold text-[#a65300]">
                Pending Approval (
                {expenses.filter((e) => e.status === "PENDING").length})
              </span>
            </div>

            {(() => {
              const approvedStatuses = ["APPROVED"];
              const approvedCount = expenses.filter((e) =>
                approvedStatuses.includes(e.status),
              ).length;

              let owedToMe = 0;
              let iOwe = 0;

              if (profile?.id) {
                expenses.forEach((e) => {
                  if (approvedStatuses.includes(e.status)) {
                    if (e.paid_by_id === profile.id) owedToMe += e.owed || 0;
                    if (e.owed_by_id === profile.id) iOwe += e.owed || 0;
                  }
                });
              }

              const net = owedToMe - iOwe;

              const balanceText = !profile
                ? "Net balance"
                : net > 0
                  ? "You will get"
                  : net < 0
                    ? "You will pay"
                    : "All settled";

              return (
                <>
                  <p className="text-[22px] font-medium text-[#29282b]">
                    {balanceText}
                  </p>

                  <p className="mt-1 text-[42px] font-bold tracking-tight">
                    {profile
                      ? `₹${Math.abs(net).toLocaleString("en-IN")}`
                      : "—"}
                  </p>

                  <p className="mt-1 text-[14px] font-medium tracking-wide text-[#5e5b60]">
                    {`Based on ${approvedCount} approved expenses`}
                  </p>
                </>
              );
            })()}
          </div>

          {/* Actions */}

          <div className="rounded-xl border border-[#ccc9cc] bg-white max-sm:p-5 p-7">
            <div className="flex flex-col max-sm:flex-row max-sm:gap-3 w-full h-full justify-between">
              {/* New Entry */}

              <button
                type="button"
                onClick={handleNewEntry}
                className="flex w-full max-sm:w-1/2 items-center justify-center gap-3 rounded-md bg-black px-5 py-4 text-[16px] font-semibold text-white transition hover:bg-[#222]"
              >
                <Plus size={21} />
                New Entry
              </button>

              {/* Mark Clear */}

              <button
                type="button"
                onClick={handleMarkClear}
                disabled={marking}
                className={`flex w-full max-sm:w-1/2 items-center justify-center gap-3 rounded-md border border-[#c7c4c7] bg-white px-5 py-3.5 text-[16px] font-medium text-[#222] transition ${
                  marking ? "opacity-70" : "hover:bg-[#f5f3f4]"
                }`}
              >
                {marking ? (
                  <svg
                    className="h-5 w-5 animate-spin text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeOpacity="0.2"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <CheckCircle size={21} />
                )}

                {marking ? "Processing..." : "Mark Clear"}
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            EXPENSES
        ==================================================== */}

        <section className="max-sm:mt-5 mt-7 overflow-hidden rounded-xl border border-[#ccc9cc] bg-white">
          {/* Section Header */}

          <div className="flex items-center justify-between gap-4 border-b border-[#d5d2d5] max-sm:px-4 max-sm:py-4 px-7 py-5">
            <h2 className="text-[23px] font-bold">Expenses</h2>

            <select
              value={expenseStatusFilter}
              onChange={(event) => setExpenseStatusFilter(event.target.value)}
              className="rounded-md border border-[#c9c6c9] bg-white px-3 py-2 text-[14px] font-medium text-[#2c2b2f] outline-none transition focus:border-black"
              aria-label="Filter expenses by status"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="CLEARED">Cleared</option>
              <option value="DENIED">Denied</option>
            </select>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="border-b border-[#d5d2d5] bg-[#faf8f9]">
                  <TableHeader>Date</TableHeader>

                  <TableHeader>Paid By</TableHeader>

                  <TableHeader>Reason</TableHeader>

                  <TableHeader>Total</TableHeader>

                  <TableHeader>Owed</TableHeader>

                  <TableHeader>Status</TableHeader>

                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <div className="flex items-center justify-center gap-3">
                        <svg
                          className="h-5 w-5 animate-spin text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeOpacity="0.2"
                          />
                          <path
                            d="M22 12a10 10 0 0 1-10 10"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>

                        <span className="text-sm text-[#68656a]">
                          Loading expenses…
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <span className="text-[15px] text-[#68656a]">
                        No expenses found for this status.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-[#d9d6d9] last:border-b-0 hover:bg-[#fdfbfc]"
                    >
                      <TableCell>{expense.date}</TableCell>

                      <TableCell>{expense.paidBy}</TableCell>

                      <TableCell>
                        <span className="font-medium">{expense.reason}</span>
                      </TableCell>

                      <TableCell>
                        ₹{expense.total.toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell>
                        ₹{expense.owed.toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>

                      <TableCell>
                        {expense.status === "PENDING" &&
                          profile?.id === expense.owed_by_id && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprove(expense.id)}
                                className="rounded-md border border-[#4776ff] px-3 py-1.5 text-[14px] font-medium text-[#3166e8] transition hover:bg-[#eef3ff]"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeny(expense.id)}
                                className="rounded-md border border-[#ef4444] px-3 py-1.5 text-[14px] font-medium text-[#b42318] transition hover:bg-[#fff5f5]"
                              >
                                Deny
                              </button>
                            </div>
                          )}
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================================================
            SETTLEMENT HISTORY
        ==================================================== */}

        <section className="max-sm:mt-5 mt-7 overflow-hidden rounded-xl border border-[#ccc9cc] bg-white">
          <div className="flex items-center justify-between border-b border-[#d5d2d5] px-7 py-5">
            <h2 className="text-[23px] font-bold">Settlements</h2>
          </div>

          <SettlementTable
            data={settlements}
            type="settlements"
            currentUserId={profile?.id}
            onConfirmSettlement={handleConfirmSettlement}
          />
        </section>

        {/* ===================================================
            NEW ENTRY MODAL
        ==================================================== */}

        <NewEntryModal
          isOpen={isNewEntryOpen}
          onClose={() => setIsNewEntryOpen(false)}
          onSuccess={() => {
            setIsNewEntryOpen(false);
            loadData();
          }}
        />
      </main>
    </div>
  );
}

/* =========================================================
   TABLE HEADER
========================================================= */

function TableHeader({ children }) {
  return (
    <th className="px-7 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-[#58565c]">
      {children}
    </th>
  );
}

/* =========================================================
   TABLE CELL
========================================================= */

function TableCell({ children }) {
  return <td className="px-7 py-4 text-[15px] text-[#2c2b2f]">{children}</td>;
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-[#fff0bf] text-[#a65300]",
    APPROVED: "bg-[#dceaff] text-[#2858b9]",
    CLEARED: "bg-[#d9f7e4] text-[#18733b]",
    DENIED: "bg-[#fff1f2] text-[#b42318]",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-sm
        px-3
        py-1.5
        text-[12px]
        font-bold
        tracking-wide
        ${styles[status] || "bg-gray-100 text-gray-700"}
      `}
    >
      {status}
    </span>
  );
}

/* =========================================================
   SETTLEMENT TABLE
========================================================= */

function SettlementTable({ data, type, currentUserId, onConfirmSettlement }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] border-collapse">
        <thead>
          <tr className="border-b border-[#d5d2d5] bg-[#faf8f9]">
            <TableHeader>{type === "monthly" ? "Month" : "Date"}</TableHeader>

            <TableHeader>
              {type === "settlements" ? "Paid By" : "Owed By"}
            </TableHeader>

            <TableHeader>
              {type === "settlements" ? "Paid To" : "Owed To"}
            </TableHeader>

            <TableHeader>Amount</TableHeader>

            <TableHeader>Status</TableHeader>

            {type === "settlements" && <TableHeader>Action</TableHeader>}
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b border-[#d9d6d9] last:border-b-0"
            >
              <TableCell>
                {type === "monthly" ? item.month : item.date}
              </TableCell>

              <TableCell>{item.paidBy || item.owedBy}</TableCell>

              <TableCell>{item.owedTo || item.owedTo}</TableCell>

              <TableCell>₹{item.amount.toLocaleString("en-IN")}</TableCell>

              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>

              {type === "settlements" && (
                <TableCell>
                  {item.status === "CLEARANCE_PENDING" &&
                    currentUserId === item.paid_to_id && (
                      <button
                        type="button"
                        onClick={() => onConfirmSettlement(item)}
                        className="rounded-md border border-[#16a34a] px-3 py-1.5 text-[14px] font-medium text-[#166534] transition hover:bg-[#ecfdf3]"
                      >
                        Confirm
                      </button>
                    )}
                </TableCell>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
