"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadDropzone from "@/components/UploadDropzone";
import AnalysisProgress from "@/components/AnalysisProgress";
import UsageMeter from "@/components/UsageMeter";

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("trustlens_guest_id");
  if (!id) {
    id = `guest_${crypto.randomUUID().replace(/-/g, "").substring(0, 32)}`;
    localStorage.setItem("trustlens_guest_id", id);
  }
  return id;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("queued");
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
    isAuthenticated: boolean;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const guestId = getGuestId();
    fetch(`/api/v1/usage?guestId=${encodeURIComponent(guestId)}`)
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  const pollStatus = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current);

      const guestId = getGuestId();
      const pollUrl = `/api/v1/analyses/${id}?guestId=${encodeURIComponent(guestId)}`;

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(pollUrl);
          const data = await res.json();
          setJobStatus(data.status);

          if (data.status === "completed") {
            if (pollRef.current) clearInterval(pollRef.current);
            router.push(`/result/${id}`);
          } else if (data.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(
              data.errorCode === "no_provider_results"
                ? "Analysis could not be completed. Please try again."
                : "Analysis failed. Please try again."
            );
            setJobId(null);
          }
        } catch {
          // Continue polling on network errors
        }
      }, 1500);
    },
    [router]
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleFileSelected = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const guestId = getGuestId();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("guestId", guestId);

      const res = await fetch("/api/v1/analyses", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }

      setJobId(data.jobId);
      setJobStatus("queued");
      pollStatus(data.jobId);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
        {!jobId ? (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Check Content
              </h1>
              <p className="text-slate-500">
                Upload an image or short video to analyze for AI involvement,
                manipulation, and provenance.
              </p>
            </div>

            {usage && (
              <div className="mb-6">
                <UsageMeter
                  used={usage.used}
                  limit={usage.limit}
                  isAuthenticated={usage.isAuthenticated}
                />
              </div>
            )}

            <UploadDropzone
              onFileSelected={handleFileSelected}
              isUploading={isUploading}
              error={error}
            />
          </div>
        ) : (
          <div className="py-12 animate-fade-in">
            <AnalysisProgress status={jobStatus} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
