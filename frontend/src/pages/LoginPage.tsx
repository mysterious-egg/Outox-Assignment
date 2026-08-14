import { Mail } from "lucide-react";
import { API_BASE_URL } from "../services/api";

function LoginPage() {
  function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#e8e8e8] bg-white p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f8f5f] text-white">
            <Mail size={24} />
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#1d1d1d]">
            Welcome to ReachInbox
          </h1>

          <p className="mt-2 text-center text-sm text-[#8b8b8b]">
            Sign in to schedule and manage your emails.
          </p>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#dedede] bg-white text-sm font-semibold text-[#333] transition hover:bg-[#f7f7f7]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.75 3.27-8.1Z"
            />

            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.24 1.05-3.71 1.05-2.87 0-5.3-1.94-6.17-4.55H2.14v2.84A11 11 0 0 0 12 23Z"
            />

            <path
              fill="#FBBC05"
              d="M5.83 14.08A6.6 6.6 0 0 1 5.48 12c0-.72.13-1.42.35-2.08V7.08H2.14A11 11 0 0 0 1 12c0 1.77.42 3.45 1.14 4.92l3.69-2.84Z"
            />

            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.14 7.08l3.69 2.84C6.7 7.31 9.13 5.38 12 5.38Z"
            />
          </svg>

          Continue with Google
        </button>

        <p className="mt-6 text-center text-xs leading-relaxed text-[#9a9a9a]">
          By continuing, you agree to sign in with your Google account.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;