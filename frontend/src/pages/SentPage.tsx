import { useEffect, useState } from "react";
import {
  ChevronDown,
  Edit3,
  Filter,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import UserProfile from "../components/UserProfile";

type SentEmail = {
  id: string;
  recipient: string;
  subject: string;
  sentAt: string | null;
  status: "SENT" | "FAILED";
};

function SentPage() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function fetchSentEmails() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/emails/sent`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch sent emails",
        );
      }

      setEmails(data.emails);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSentEmails();
  }, []);

  const filteredEmails = emails.filter((email) => {
    const searchValue = search.toLowerCase();

    return (
      email.recipient.toLowerCase().includes(searchValue) ||
      email.subject.toLowerCase().includes(searchValue)
    );
  });

  return (
    <div className="flex min-h-screen bg-white text-[#1d1d1d]">
      {/* Sidebar */}
      <aside className="flex min-h-screen w-[260px] shrink-0 flex-col border-r border-[#e9e9e9] px-4 py-6">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f8f5f] text-white">
            <Mail size={18} />
          </div>

          <span className="text-lg font-semibold tracking-tight">
            ReachInbox
          </span>
        </div>

        {/* User profile */}
        <UserProfile />

        {/* Compose */}
        <button
          onClick={() => navigate("/compose")}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1f8f5f] text-sm font-semibold text-white transition hover:bg-[#18784e]"
        >
          <Edit3 size={17} />
          Compose
        </button>

        {/* Navigation */}
        <div className="mt-9">
          <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.12em] text-[#a0a0a0]">
            CORE
          </p>

          <nav className="space-y-1">
            <NavLink
              to="/scheduled"
              className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#737373] transition hover:bg-[#f7f7f7]"
            >
              <Mail size={18} />
              <span>Scheduled</span>
            </NavLink>

            <NavLink
              to="/sent"
              className={({ isActive }) =>
                `flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#eef8f3] text-[#1f8f5f]"
                    : "text-[#737373] hover:bg-[#f7f7f7]"
                }`
              }
            >
              <Mail size={18} />
              <span>Sent</span>

              <span className="ml-auto text-xs text-[#999]">
                {emails.length}
              </span>
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 px-10 py-9">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">
              Sent Emails
            </h1>

            <p className="mt-2 text-sm text-[#8b8b8b]">
              View emails that have been sent
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchSentEmails}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8e8e8] text-[#696969] hover:bg-[#f8f8f8]"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8e8e8] text-[#696969] hover:bg-[#f8f8f8]">
              <Filter size={18} />
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="mb-6 flex h-11 max-w-[430px] items-center gap-3 rounded-lg border border-[#e8e8e8] px-4 text-[#9a9a9a]">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search emails"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-[#333] outline-none placeholder:text-[#a5a5a5]"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[420px] items-center justify-center border-t border-[#ececec]">
            <p className="text-sm text-[#8b8b8b]">
              Loading sent emails...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredEmails.length === 0 && (
          <div className="flex min-h-[420px] flex-col items-center justify-center border-t border-[#ececec] text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f7f5] text-[#1f8f5f]">
              <Mail size={26} />
            </div>

            <h2 className="text-base font-semibold">
              No sent emails
            </h2>

            <p className="mt-2 text-sm text-[#929292]">
              Emails you send will appear here.
            </p>

            <button
              onClick={() => navigate("/compose")}
              className="mt-5 rounded-lg bg-[#1f8f5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#18784e]"
            >
              Compose New Email
            </button>
          </div>
        )}

        {/* Email table */}
        {!loading && !error && filteredEmails.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#e8e8e8]">
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-[#e8e8e8] bg-[#fafafa]">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#888]">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#888]">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#888]">
                    Sent Time
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#888]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEmails.map((email) => (
                  <tr
                    key={email.id}
                    onClick={() =>
                      navigate(`/emails/${email.id}`)
                    }
                    className="cursor-pointer border-b border-[#eeeeee] last:border-0 hover:bg-[#fafafa]"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-[#333]">
                      {email.recipient}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#666]">
                      {email.subject}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#666]">
                      {email.sentAt
                        ? new Date(
                            email.sentAt,
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          email.status === "SENT"
                            ? "bg-[#eef8f3] text-[#1f8f5f]"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {email.status === "SENT"
                          ? "Sent"
                          : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default SentPage;