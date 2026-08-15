"use client";

import { useState, useCallback } from "react";
import { Share2, Check, Copy, Link as LinkIcon, AlertCircle } from "lucide-react";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { useMounted } from "@/hooks";

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
  const [error, setError] = useState<string | null>(null);

  const mounted = useMounted();
  // Only safe to read `window` once we're mounted; the component returns null
  // until then, so this is always populated by the time it's used.
  const shareUrl = mounted ? `${window.location.origin}/report/${publicId}` : "";

  const handleShare = async () => {
    if (!isPublic) {
      setSharing(true);
      setError(null);
      try {
        const guestId = getGuestId();
        const res = await fetch(`/api/v1/reports/${publicId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to enable sharing");
        }
        
        setIsPublic(true);
      } catch (err) {
        setError("Failed to enable sharing. Please try again.");
      }
      setSharing(false);
    }
  };

  const handleCopy = useCallback(async () => {
    if (!isPublic) {
      await handleShare();
    }
    
    if (!shareUrl) return;
    
    const success = await copyToClipboard(shareUrl);
    
    if (success) {
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Show manual copy dialog
      setError(null);
      window.prompt("Copy this link:", shareUrl);
    }
  }, [isPublic, shareUrl, handleShare]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
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
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 shrink-0 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
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
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
