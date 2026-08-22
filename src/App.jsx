import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSetAtom } from "jotai";

import { supabase } from "./lib/supabase";

import { userAtom, profileAtom, authLoadingAtom } from "./atoms/authAtom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

function App() {
  const setUser = useSetAtom(userAtom);
  const setProfile = useSetAtom(profileAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!error && profile) {
          setProfile(profile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      setAuthLoading(false);
    };

    initializeAuth();

    // Listen for login/logout/session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setProfile(profile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      setAuthLoading(false);
    });

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setAuthLoading]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
