import { useState } from "react";
import { useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { userAtom, profileAtom } from "../../atoms/authAtom";

function LoginForm() {
  const navigate = useNavigate();

  const setUser = useSetAtom(userAtom);
  const setProfile = useSetAtom(profileAtom);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Unable to log in. Please try again.");
      }

      // Store authenticated user in Jotai
      setUser(authData.user);

      // Get corresponding profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Store profile in Jotai
      setProfile(profile);

      // Go to dashboard
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      setError(error?.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-100">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-black mb-2">
          Roommate Ledger
        </h1>

        <p className="text-base text-[#45464c]">
          Simple expense tracking for Vishal & Shivam
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-lg border border-[#e5e2e3] p-6 shadow-sm">
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#1b1b1d] mb-1"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="
                w-full
                rounded-lg
                border border-[#c6c6cd]
                bg-white
                px-4 py-2
                text-base
                text-[#1b1b1d]
                outline-none
                transition-colors
                placeholder:text-[#45464c]/50
                focus:border-black
                focus:ring-1
                focus:ring-black
                disabled:opacity-60
              "
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#1b1b1d]"
              >
                Password
              </label>
            </div>

            {/* Password input + show button */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className="
                  w-full
                  rounded-lg
                  border border-[#c6c6cd]
                  bg-white
                  px-4 py-2
                  pr-12
                  text-base
                  text-[#1b1b1d]
                  outline-none
                  transition-colors
                  focus:border-black
                  focus:ring-1
                  focus:ring-black
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-[#585f6c]
                  hover:text-black
                "
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "◉" : "◌"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="
                rounded-lg
                border border-red-200
                bg-red-50
                px-3 py-2
                text-sm
                text-red-700
              "
            >
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              rounded-lg
              bg-black
              text-white
              text-sm
              font-medium
              py-2
              px-4
              mt-2
              transition-opacity
              hover:opacity-90
              disabled:opacity-50
              disabled:cursor-not-allowed
              flex
              items-center
              justify-center
              gap-2
            "
          >
            {loading ? (
              <>
                <span
                  className="
                    h-4
                    w-4
                    rounded-full
                    border-2
                    border-white/30
                    border-t-white
                    animate-spin
                  "
                />
                Logging in...
              </>
            ) : (
              <>
                Log In
                <span className="text-lg">→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
