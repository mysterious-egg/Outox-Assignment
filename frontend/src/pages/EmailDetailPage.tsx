import {
  ArrowLeft,
  Clock3,
  Edit3,
  Mail,
} from "lucide-react";
import {
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";

type Email = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  sender: string;
  scheduledAt: string;
  sentAt: string | null;
  status: "SCHEDULED" | "SENT" | "FAILED";
  error: string | null;
};

function EmailDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEmail() {
      if (!id) {
        setError("Invalid email ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/emails/${id}`,
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch email",
          );
        }

        if (!data.success || !data.email) {
          throw new Error("Email not found");
        }

        setEmail(data.email);
      } catch (error) {
        console.error(
          "Failed to fetch email:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch email",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchEmail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading email...
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-base font-semibold text-[#333]">
            {error || "Email not found."}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-lg bg-[#1f8f5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#18784e]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-[#1d1d1d]">
      <aside className="flex min-h-screen w-[260px] shrink-0 flex-col border-r border-[#e9e9e9] px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f8f5f] text-white">
            <Mail size={18} />
          </div>

          <span className="text-lg font-semibold">
            ReachInbox
          </span>
        </div>

        <button
          onClick={() => navigate("/compose")}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1f8f5f] text-sm font-semibold text-white"
        >
          <Edit3 size={17} />
          Compose
        </button>

        <nav className="mt-9 space-y-1">
          <NavLink
            to="/scheduled"
            className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-[#737373] hover:bg-[#f7f7f7]"
          >
            <Clock3 size={18} />
            Scheduled
          </NavLink>

          <NavLink
            to="/sent"
            className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-[#737373] hover:bg-[#f7f7f7]"
          >
            <Mail size={18} />
            Sent
          </NavLink>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-10 py-9">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-[#777]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="max-w-4xl">
          <div className="border-b border-[#ececec] pb-6">
            <div className="flex items-start justify-between">
              <h1 className="text-[28px] font-semibold">
                {email.subject}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  email.status === "SENT"
                    ? "bg-[#eef8f3] text-[#1f8f5f]"
                    : email.status === "FAILED"
                      ? "bg-red-50 text-red-600"
                      : "bg-[#fff8e8] text-[#b7791f]"
                }`}
              >
                {email.status}
              </span>
            </div>
          </div>

          <div className="py-7">
            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#999]">
                From
              </p>

              <p>{email.sender}</p>
            </div>

            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#999]">
                To
              </p>

              <p>{email.recipient}</p>
            </div>

            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#999]">
                Scheduled For
              </p>

              <p>
                {new Date(
                  email.scheduledAt,
                ).toLocaleString()}
              </p>
            </div>

            {email.sentAt && (
              <div className="mb-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#999]">
                  Sent At
                </p>

                <p>
                  {new Date(
                    email.sentAt,
                  ).toLocaleString()}
                </p>
              </div>
            )}

            {email.error && (
              <div className="mb-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-500">
                  Error
                </p>

                <p className="text-red-600">
                  {email.error}
                </p>
              </div>
            )}

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#999]">
                Message
              </p>

              <div className="whitespace-pre-wrap rounded-xl border border-[#e8e8e8] p-6 text-sm leading-7 text-[#555]">
                {email.body}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmailDetailPage;