import { useState } from "react";
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

function Dashboard() {
  const profile = useAtomValue(profileAtom);

  const [activeTab, setActiveTab] = useState("monthly");
  const [currentPage, setCurrentPage] = useState(1);

  // Temporary data.
  // We will replace this with Supabase data next.
  const expenses = [
    {
      id: 1,
      date: "24 Aug 2026",
      paidBy: "Shivam",
      reason: "Electricity",
      total: 800,
      owed: 400,
      status: "PENDING",
    },
    {
      id: 2,
      date: "22 Aug 2026",
      paidBy: "Vishal",
      reason: "Groceries",
      total: 1000,
      owed: 400,
      status: "APPROVED",
    },
    {
      id: 3,
      date: "20 Aug 2026",
      paidBy: "Vishal",
      reason: "Internet",
      total: 600,
      owed: 300,
      status: "APPROVED",
    },
  ];

  const monthlySettlements = [
    {
      id: 1,
      month: "June 2026",
      owedBy: "Shivam",
      owedTo: "Vishal",
      amount: 1200,
      status: "CLEARED",
    },
    {
      id: 2,
      month: "May 2026",
      owedBy: "Vishal",
      owedTo: "Shivam",
      amount: 450,
      status: "CLEARED",
    },
  ];

  const clearanceHistory = [
    {
      id: 1,
      date: "30 June 2026",
      owedBy: "Shivam",
      owedTo: "Vishal",
      amount: 1200,
      status: "CLEARED",
    },
    {
      id: 2,
      date: "31 May 2026",
      owedBy: "Vishal",
      owedTo: "Shivam",
      amount: 450,
      status: "CLEARED",
    },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNewEntry = () => {
    console.log("Open new expense modal");
  };

  const handleMarkClear = () => {
    console.log("Mark current balance as clear");
  };

  const handleApprove = (expenseId) => {
    console.log("Approve expense:", expenseId);
  };

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
            <button
              type="button"
              className="relative rounded-lg p-2 text-[#45444a] transition hover:bg-[#f0edef]"
              aria-label="Notifications"
            >
              <Bell size={22} strokeWidth={2} />

              {/* Notification dot */}
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
                Pending Approval (1)
              </span>
            </div>

            <p className="text-[22px] font-medium text-[#29282b]">
              Shivam owes Vishal
            </p>

            <p className="mt-1 text-[42px] font-bold tracking-tight">₹1,250</p>

            <p className="mt-1 text-[14px] font-medium tracking-wide text-[#5e5b60]">
              Based on 8 approved expenses
            </p>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-[#ccc9cc] bg-white p-7">
            <button
              type="button"
              onClick={handleNewEntry}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-black px-5 py-4 text-[16px] font-semibold text-white transition hover:bg-[#222]"
            >
              <Plus size={21} />
              New Entry
            </button>

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
                {expenses.map((expense) => (
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
                      {expense.status === "PENDING" && (
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
                ))}
              </tbody>
            </table>
          </div>

          {/* View All */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 border-t border-[#d5d2d5] py-3.5 text-[14px] font-semibold transition hover:bg-[#f8f6f7]"
          >
            View All Expenses
            <ArrowRight size={16} />
          </button>
        </section>

        {/* ===================================================
            SETTLEMENT HISTORY
        ==================================================== */}
        <section className="mt-7 overflow-hidden rounded-xl border border-[#ccc9cc] bg-white">
          {/* Tabs */}
          <div className="flex border-b border-[#d5d2d5] px-7">
            <button
              type="button"
              onClick={() => setActiveTab("monthly")}
              className={`
                relative px-0 py-5 mr-8 text-[16px] font-semibold
                ${activeTab === "monthly" ? "text-[#1b1b1d]" : "text-[#68656a]"}
              `}
            >
              Monthly Settlements
              {activeTab === "monthly" && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-black" />
              )}
            </button>

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
          <p className="text-sm text-[#68656a]">Showing 1–3 of 3 expenses</p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              className="rounded-md p-2 text-[#55535a] hover:bg-[#ebe8e9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="h-8 min-w-8 rounded-md bg-black px-2 text-sm font-medium text-white"
            >
              {currentPage}
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded-md p-2 text-[#55535a] hover:bg-[#ebe8e9]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
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
