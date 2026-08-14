"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Loader2, Activity, Users, CheckCircle, XCircle, FlaskConical } from "lucide-react";

interface AdminData {
  stats: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalUsers: number;
  };
  detectionMode: string;
  recentJobs: Array<{
    id: string;
    status: string;
    createdAt: string;
    errorCode: string | null;
  }>;
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/status")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <XCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Access Denied</h2>
          <p className="text-slate-500">You must be signed in as an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Status</h1>
        <p className="text-slate-500 mb-8">Development and debugging dashboard.</p>

        {/* Detection mode */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-amber-700 mb-6">
          <FlaskConical className="w-4 h-4" />
          Detection mode: <strong>{data.detectionMode}</strong>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Jobs", value: data.stats.totalJobs, icon: Activity },
            { label: "Completed", value: data.stats.completedJobs, icon: CheckCircle },
            { label: "Failed", value: data.stats.failedJobs, icon: XCircle },
            { label: "Users", value: data.stats.totalUsers, icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent jobs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Recent Analysis Jobs
          </h3>
          {data.recentJobs.length === 0 ? (
            <p className="text-sm text-slate-400">No jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        job.status === "completed"
                          ? "bg-green-400"
                          : job.status === "failed"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                      }`}
                    />
                    <span className="text-sm font-mono text-slate-600">
                      {job.id.substring(0, 8)}…
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 capitalize">{job.status}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(job.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
