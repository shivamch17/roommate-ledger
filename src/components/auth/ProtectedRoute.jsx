import { Navigate } from "react-router-dom";
import { useAtomValue } from "jotai";

import { userAtom, authLoadingAtom } from "../../atoms/authAtom";

function ProtectedRoute({ children }) {
  const user = useAtomValue(userAtom);
  const loading = useAtomValue(authLoadingAtom);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf8fa] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[#45464c]">
          <span
            className="
              h-4 w-4
              rounded-full
              border-2
              border-black/20
              border-t-black
              animate-spin
            "
          />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
