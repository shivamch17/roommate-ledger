import { useAtomValue } from "jotai";
import { profileAtom } from "../atoms/authAtom";

function Dashboard() {
  const profile = useAtomValue(profileAtom);

  return (
    <div className="min-h-screen bg-[#fcf8fa] p-8">
      <h1 className="text-2xl font-semibold">
        Welcome, {profile?.name || "User"}
      </h1>

      <p className="mt-2 text-[#45464c]">
        Your roommate ledger will appear here.
      </p>
    </div>
  );
}

export default Dashboard;
