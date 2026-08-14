"use client";

import { useState, useEffect } from "react";
import { Share2, Check, Copy, Link as LinkIcon } from "lucide-react";

interface ShareReportButtonProps {
  publicId: string;
  isPublic: boolean;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("trustlens_guest_id") || "";
}

export default function ShareReportButton({
  publicId,
  isPublic: initialPublic,
}: ShareReportButtonProps) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/report/${publicId}`);
    }
  }, [publicId]);

  const handleShare = async () => {
    if (!isPublic) {
      setSharing(true);
      try {
        const guestId = getGuestId();
        await fetch(`/api/v1/reports/${publicId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId }),
        });
        setIsPublic(true);
      } catch {
        // Handle error silently - could add error state
      }
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!isPublic) await handleShare();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {!isPublic ? (
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
          {sharing ? "Enabling..." : "Share Report"}
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
          <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-sm text-slate-600 outline-none flex-1 min-w-0"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
