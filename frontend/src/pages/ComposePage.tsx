import { ArrowLeft, Calendar, Paperclip, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import AppSidebar from "../components/AppSidebar";
import { API_BASE_URL } from "../services/api";


function ComposePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delayBetweenEmails, setDelayBetweenEmails] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("100");
  const [startTime, setStartTime] = useState("");
  const [fileName, setFileName] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/emails/parse`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to parse file");
      }

      setFileName(file.name);
      setRecipientCount(data.count);
      setRecipients(data.recipients);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse file",
      );

      setFileName("");
      setRecipientCount(null);
      setRecipients([]);
    } finally {
      setIsParsing(false);
    }
  }

  function removeFile() {
    setFileName("");
    setRecipientCount(null);
    setRecipients([]);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSchedule() {
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/emails/schedule`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipients,
            subject,
            body,
            startTime: new Date(startTime).toISOString(),
            delayBetweenEmails: Number(delayBetweenEmails),
            hourlyLimit: Number(hourlyLimit),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to schedule emails",
        );
      }

      navigate("/scheduled");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to schedule emails",
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-[72px] items-center border-b border-[#eeeeee] px-8">
          <button
            onClick={() => navigate("/scheduled")}
            className="mr-4 flex h-9 w-9 items-center justify-center rounded-lg text-[#666] hover:bg-[#f5f5f5]"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-[20px] font-semibold text-[#202020]">
            Compose New Email
          </h1>
        </header>

        {/* Content */}
        <section className="flex-1 px-8 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border border-[#e8e8e8] bg-white p-7">
              {/* Subject */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#333]">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Enter email subject"
                  className="h-11 w-full rounded-lg border border-[#e3e3e3] px-4 text-sm outline-none transition placeholder:text-[#a3a3a3] focus:border-[#1f8f5f]"
                />
              </div>

              {/* Upload */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#333]">
                  Recipient List
                </label>

                {!fileName ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-[130px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#d8d8d8] bg-[#fafafa] text-center hover:bg-[#f6f6f6]"
                  >
                    <Paperclip
                      size={24}
                      className="mb-3 text-[#777]"
                    />

                    <span className="text-sm font-medium text-[#444]">
                      Upload CSV or TXT file
                    </span>

                    <span className="mt-1 text-xs text-[#999]">
                      Select a file containing recipient email addresses
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-[#dcefe6] bg-[#f5fbf7] px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-[#333]">
                        {fileName}
                      </p>

                      <p className="mt-1 text-xs text-[#1f8f5f]">
                        {recipientCount} email
                        {recipientCount === 1 ? "" : "s"} detected
                      </p>
                    </div>

                    <button
                      onClick={removeFile}
                      className="rounded-md p-2 text-[#777] hover:bg-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isParsing && (
                  <p className="mt-2 text-sm text-[#777]">
                    Detecting email addresses...
                  </p>
                )}

                {error && (
                  <p className="mt-2 text-sm text-red-500">
                    {error}
                  </p>
                )}
              </div>

              {/* Delay + hourly limit */}
              <div className="mb-6 grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#333]">
                    Delay between emails
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={delayBetweenEmails}
                      onChange={(event) =>
                        setDelayBetweenEmails(event.target.value)
                      }
                      className="h-11 w-full rounded-lg border border-[#e3e3e3] px-4 pr-16 text-sm outline-none focus:border-[#1f8f5f]"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#888]">
                      seconds
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#333]">
                    Hourly limit
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={hourlyLimit}
                      onChange={(event) =>
                        setHourlyLimit(event.target.value)
                      }
                      className="h-11 w-full rounded-lg border border-[#e3e3e3] px-4 pr-16 text-sm outline-none focus:border-[#1f8f5f]"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#888]">
                      emails
                    </span>
                  </div>
                </div>
              </div>

              {/* Start time */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#333]">
                  Start time
                </label>

                <div className="relative">
                  <Calendar
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#888]"
                  />

                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-[#e3e3e3] pl-11 pr-4 text-sm outline-none focus:border-[#1f8f5f]"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="mb-8">
                <label className="mb-2 block text-sm font-medium text-[#333]">
                  Email body
                </label>

                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your email..."
                  className="min-h-[220px] w-full resize-none rounded-lg border border-[#e3e3e3] p-4 text-sm outline-none placeholder:text-[#a3a3a3] focus:border-[#1f8f5f]"
                />
              </div>

              {/* Action */}
              <div className="flex justify-end border-t border-[#eeeeee] pt-6">
                <button
                  onClick={handleSchedule}
                  disabled={
                    isParsing ||
                    !subject ||
                    !body ||
                    recipients.length === 0 ||
                    !startTime
                  }
                  className="flex h-11 items-center gap-2 rounded-lg bg-[#1f8f5f] px-6 text-sm font-semibold text-white transition hover:bg-[#18774e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Calendar size={17} />
                  Schedule Email
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ComposePage;