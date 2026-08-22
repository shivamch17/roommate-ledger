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
  const [monthlySettlements, setMonthlySettlements] = useState([]);
  const [clearanceHistory, setClearanceHistory] = useState([]);
  const [profiles, setProfiles] = useState([]);

  async function loadData() {
    setLoading(true);

    try {
      // Expenses
      const { data: expensesData, error: expErr } = await supabase
        .from("expenses")
        .select(
          `id, created_at, paid_by, owed_by, description, total_amount, owed_amount, status, approved_at`
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (expErr) throw expErr;

      // Monthly settlements
      const { data: monthlyData, error: monthErr } = await supabase
        .from("monthly_settlements")
        .select(`id, month, owed_by, owed_to, amount`)
        .order("month", { ascending: false })
        .limit(12);

      if (monthErr) throw monthErr;

      // Cleared settlements history
      const { data: clearedData, error: clearErr } = await supabase
        .from("settlements")
        .select(`id, marked_paid_at, paid_by, paid_to, amount, status`)
        .order("marked_paid_at", { ascending: false })
        .limit(50);

      if (clearErr) throw clearErr;

      // Gather profile ids
      const ids = new Set();
      (expensesData || []).forEach((e) => {
        if (e.paid_by) ids.add(e.paid_by);
        if (e.owed_by) ids.add(e.owed_by);
      });
      (monthlyData || []).forEach((m) => {
        if (m.owed_by) ids.add(m.owed_by);
        if (m.owed_to) ids.add(m.owed_to);
      });
      (clearedData || []).forEach((s) => {
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

        profilesMap = Object.fromEntries((profilesData || []).map((p) => [p.id, p.name]));
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
        }))
      );

      setMonthlySettlements(
        (monthlyData || []).map((m) => ({
          id: m.id,
          month: new Date(m.month).toLocaleString("en-IN", {
            month: "long",
            year: "numeric",
          }),
          owedBy: profilesMap[m.owed_by] || m.owed_by,
          owedTo: profilesMap[m.owed_to] || m.owed_to,
          amount: Number(m.amount),
          status: "CLEARED",
        }))
      );

      setClearanceHistory(
        (clearedData || []).map((s) => ({
          id: s.id,
          date: s.marked_paid_at
            ? new Date(s.marked_paid_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
          owedBy: profilesMap[s.paid_by] || s.paid_by,
          owedTo: profilesMap[s.paid_to] || s.paid_to,
          amount: Number(s.amount),
          status: (s.status || "").toUpperCase(),
        }))
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

  const handleMarkClear = () => {
    console.log("Mark current balance as clear");
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

        const { error } = await supabase.from("expenses").update(updates).eq("id", expenseId);
        if (error) throw error;

        await loadData();
      } catch (err) {
        console.error("Failed to approve expense:", err.message || err);
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

  return (
    <div className="min-h-screen bg-[#fcf8fa] text-[#1b1b1d]">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#d5d1d4] bg-[#fcf8fa]">
        <div className="mx-auto flex max-w-[1250px] items-center justify-between px-6 py-4">
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
            {/* Notifications */}

            <button
              type="button"
              className="relative rounded-lg p-2 text-[#45444a] transition hover:bg-[#f0edef]"
              aria-label="Notifications"
            >
              <Bell size={22} strokeWidth={2} />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#d97706]" />
            </button>

            {/* Profile */}

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#c9c6c9] bg-[#e9e5e7] text-sm font-semibold"
              title={displayName}
            >
              {initials}
            </button>

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

      <main className="mx-auto max-w-[1250px] px-6 py-7">
        {/* ===================================================
            TOP SECTION
        ==================================================== */}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_400px]">
          {/* Current Balance */}

          <div className="rounded-xl border border-[#ccc9cc] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="mb-5 flex items-start justify-between">
                <p className="text-[16px] font-medium uppercase tracking-wide text-[#58565c]">
                  Current Balance
                </p>

                <span className="rounded-sm bg-[#fff0bf] px-3 py-1.5 text-[13px] font-semibold text-[#a65300]">
                  Pending Approval ({expenses.filter((e) => e.status === "PENDING").length})
                </span>
              </div>

              {(() => {
                const approvedStatuses = ["APPROVED", "CLEARED"];
                const approvedCount = expenses.filter((e) => approvedStatuses.includes(e.status)).length;

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
                  ? "You are owed"
                  : net < 0
                  ? "You owe"
                  : "All settled";

                return (
                  <>
                    <p className="text-[22px] font-medium text-[#29282b]">{balanceText}</p>

                    <p className="mt-1 text-[42px] font-bold tracking-tight">{profile ? `₹${Math.abs(net).toLocaleString("en-IN")}` : "—"}</p>

                    <p className="mt-1 text-[14px] font-medium tracking-wide text-[#5e5b60]">
                      {`Based on ${approvedCount} approved expenses`}
                    </p>
                  </>
                );
              })()}
          </div>

          {/* Actions */}

          <div className="rounded-xl border border-[#ccc9cc] bg-white p-7">
            {/* New Entry */}

            <button
              type="button"
              onClick={handleNewEntry}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-black px-5 py-4 text-[16px] font-semibold text-white transition hover:bg-[#222]"
            >
              <Plus size={21} />
              New Entry
            </button>

            {/* Mark Clear */}

            <button
              type="button"
              onClick={handleMarkClear}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-md border border-[#c7c4c7] bg-white px-5 py-3.5 text-[16px] font-medium text-[#222] transition hover:bg-[#f5f3f4]"
            >
              <CheckCircle size={21} />
              Mark Clear
            </button>
          </div>
        </section>

        {/* ===================================================
            EXPENSES
        ==================================================== */}

        <section className="mt-7 overflow-hidden rounded-xl border border-[#ccc9cc] bg-white">
          {/* Section Header */}

          <div className="flex items-center justify-between border-b border-[#d5d2d5] px-7 py-5">
            <h2 className="text-[23px] font-bold">Expenses</h2>

            <button
              type="button"
              className="rounded-md p-2 text-[#4e4c51] transition hover:bg-[#f3f1f2]"
              title="Filter expenses"
            >
              <SlidersHorizontal size={22} />
            </button>
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

                        <span className="text-sm text-[#68656a]">Loading expenses…</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
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
                        {expense.status === "PENDING" && profile?.id === expense.owed_by_id && (
                          <button
                            type="button"
                            onClick={() => handleApprove(expense.id)}
                            className="rounded-md border border-[#4776ff] px-3 py-1.5 text-[14px] font-medium text-[#3166e8] transition hover:bg-[#eef3ff]"
                          >
                            Approve
                          </button>
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

        <section className="mt-7 overflow-hidden rounded-xl border border-[#ccc9cc] bg-white">
          {/* Tabs */}

          <div className="flex border-b border-[#d5d2d5] px-7">
            {/* Monthly Settlements */}

            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`
                relative mr-8 px-0 py-5 text-[16px] font-semibold
                ${activeTab === "monthly" ? "text-[#1b1b1d]" : "text-[#68656a]"}
              `}
            >
              Monthly Settlements
              {activeTab === "monthly" && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-black" />
              )}
            </button>

            {/* Clearance History */}

            <button
              type="button"
              onClick={() => setActiveTab("clearance")}
              className={`
                relative px-0 py-5 text-[16px] font-semibold
                ${
                  activeTab === "clearance"
                    ? "text-[#1b1b1d]"
                    : "text-[#68656a]"
                }
              `}
            >
              Clearance History
              {activeTab === "clearance" && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-black" />
              )}
            </button>
          </div>

          {/* Monthly Settlements */}

          {activeTab === "monthly" && (
            <SettlementTable data={monthlySettlements} type="monthly" />
          )}

          {/* Clearance History */}

          {activeTab === "clearance" && (
            <SettlementTable data={clearanceHistory} type="clearance" />
          )}
        </section>

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[#68656a]">
            {loading ? "Loading…" : `Showing 1–${Math.min(expenses.length, 10)} of ${expenses.length} expenses`}
          </p>

          <div className="flex items-center gap-1">
            {/* Previous */}

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              className="rounded-md p-2 text-[#55535a] hover:bg-[#ebe8e9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Current Page */}

            <button
              type="button"
              className="h-8 min-w-8 rounded-md bg-black px-2 text-sm font-medium text-white"
            >
              {currentPage}
            </button>

            {/* Next */}

            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded-md p-2 text-[#55535a] hover:bg-[#ebe8e9]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

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

function SettlementTable({ data, type }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] border-collapse">
        <thead>
          <tr className="border-b border-[#d5d2d5] bg-[#faf8f9]">
            <TableHeader>{type === "monthly" ? "Month" : "Date"}</TableHeader>

            <TableHeader>Owed By</TableHeader>

            <TableHeader>Owed To</TableHeader>

            <TableHeader>Amount</TableHeader>

            <TableHeader>Status</TableHeader>
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

              <TableCell>{item.owedBy}</TableCell>

              <TableCell>{item.owedTo}</TableCell>

              <TableCell>₹{item.amount.toLocaleString("en-IN")}</TableCell>

              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;