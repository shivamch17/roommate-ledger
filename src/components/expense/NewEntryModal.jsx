import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAtom } from "jotai";
import { profileAtom } from "../../atoms/authAtom";

// Brevo API configuration
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Sender details (configure these in .env or update directly)
const SENDER_EMAIL =
  import.meta.env.VITE_BREVO_SENDER_EMAIL || "noreply@example.com";
const SENDER_NAME = import.meta.env.VITE_BREVO_SENDER_NAME || "Roommate Ledger";

/**
 * Send approval request email via Brevo
 */
async function sendApprovalEmail({
  recipientEmail,
  recipientName,
  payerName,
  totalAmount,
  owedAmount,
  reason,
}) {
  if (!BREVO_API_KEY) {
    console.warn("Brevo API key not configured. Skipping email notification.");
    return { success: false, error: "API key missing" };
  }

  const formattedTotal = `₹${totalAmount.toLocaleString("en-IN")}`;
  const formattedOwed = `₹${owedAmount.toLocaleString("en-IN")}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fcf8fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; border: 1px solid #ccc9cc; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">

        <!-- Header -->
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #1b1b1d; letter-spacing: -0.5px;">
          New Expense Added
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #58565c;">
          ${payerName} added an expense that needs your approval
        </p>

        <!-- Expense Details Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f5f6; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 13px; color: #58565c; text-transform: uppercase; letter-spacing: 0.5px;">Description</span>
                    <br>
                    <span style="font-size: 16px; font-weight: 600; color: #1b1b1d;">${reason}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #ddd9dc;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 14px; color: #58565c;">Total Amount</td>
                        <td style="text-align: right; font-size: 14px; font-weight: 600; color: #1b1b1d;">${formattedTotal}</td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px; font-size: 14px; color: #58565c;">Your Share</td>
                        <td style="padding-top: 8px; text-align: right; font-size: 14px; font-weight: 600; color: #1b1b1d;">${formattedOwed}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #29282b;">
          Please review and approve this expense in your dashboard.
        </p>

        <a href="${window.location.origin}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 15px; font-weight: 600;">
          View Dashboard
        </a>

        <!-- Footer -->
        <p style="margin: 32px 0 0 0; font-size: 12px; color: #77747a; text-align: center;">
          This is an automated message from Roommate Ledger
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
New Expense Added

${payerName} added an expense that needs your approval.

Description: ${reason}
Total Amount: ${formattedTotal}
Your Share: ${formattedOwed}

Please review and approve this expense at: ${window.location.origin}

— Roommate Ledger
  `.trim();

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [
      {
        email: recipientEmail,
        name: recipientName || "Roommate",
      },
    ],
    subject: `${payerName} added an expense – Approval needed`,
    htmlContent,
    textContent,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Brevo API error:", errorData);
      return { success: false, error: errorData };
    }

    const result = await response.json();
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

function NewEntryModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [owedAmount, setOwedAmount] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile] = useAtom(profileAtom);

  const handleNonNegativeCurrencyInput = (value, setter) => {
    if (value === "") {
      setter("");
      return;
    }

    if (value.startsWith("-")) {
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setter(value);
  };

  if (!isOpen) {
    return null;
  }

  const totalAmount = Number(amount);
  const roommateOwed = Number(owedAmount);

  const yourShare =
    totalAmount > 0 && roommateOwed >= 0
      ? Math.max(0, totalAmount - roommateOwed)
      : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // -----------------------------
    // Validation
    // -----------------------------

    if (!amount || totalAmount <= 0 || totalAmount < 0) {
      setError("Please enter a valid total amount.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason for the expense.");
      return;
    }

    if (!owedAmount || roommateOwed <= 0 || roommateOwed < 0) {
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
        .select("id, name, email")
        .neq("id", user.id)
        .limit(1);

      if (profErr) throw profErr;
      if (!otherProfiles || otherProfiles.length === 0)
        throw new Error("No roommate profile found");

      const roommate = otherProfiles[0];
      const roommateId = roommate.id;

      const payload = {
        created_by: user.id,
        paid_by: user.id,
        total_amount: totalAmount,
        description: reason.trim(),
        owed_by: roommateId,
        owed_amount: roommateOwed,
        status: "pending_approval",
      };

      const { error: insertErr } = await supabase
        .from("expenses")
        .insert([payload]);
      if (insertErr) throw insertErr;

      // Send approval email notification (non-blocking)
      if (roommate.email) {
        sendApprovalEmail({
          recipientEmail: roommate.email,
          recipientName: roommate.name,
          payerName: profile?.name || "Your roommate",
          totalAmount,
          owedAmount: roommateOwed,
          reason: reason.trim(),
        }).then((result) => {
          if (result.success) {
            console.log("Approval email sent:", result.messageId);
          }
        });
      } else {
        console.warn("Roommate has no email address. Skipping notification.");
      }

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
                onChange={(event) =>
                  handleNonNegativeCurrencyInput(event.target.value, setAmount)
                }
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
                onChange={(event) =>
                  handleNonNegativeCurrencyInput(
                    event.target.value,
                    setOwedAmount,
                  )
                }
                placeholder="0.00"
                disabled={loading}
                className="w-full rounded-md border border-[#c9c6c9] bg-white py-3 pl-9 pr-16 text-[16px] outline-none transition placeholder:text-[#aaa7ab] focus:border-black disabled:bg-[#f5f3f4]"
              />

              {/* Split /2: fill owed amount with half the total */}
              <button
                type="button"
                onClick={() =>
                  setOwedAmount(Number(totalAmount / 2).toFixed(2))
                }
                disabled={loading || !amount || totalAmount <= 0}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-md border border-[#c9c6c9] bg-white px-2 py-1 text-[12px] font-semibold text-[#58565c] transition hover:bg-[#f5f3f4] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Split total evenly"
                title="Divide by 2"
              >
                /2
              </button>
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
