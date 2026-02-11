"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionList } from "@/components/SessionList";
import { SessionView } from "@/components/SessionView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "@/lib/auth";
import { Loader2, LogOut, Menu, X } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const createSession = useMutation(api.sessions.createSession);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleCreateSession = async () => {
    if (!user || isCreatingSession) return;
    setIsCreatingSession(true);
    try {
      const sessionId = await createSession({
        userId: user.uid,
      });
      setSelectedSessionId(sessionId);
      setSidebarOpen(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex">
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 flex flex-col overflow-hidden transform transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:max-w-none md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CramFast
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                title="Close sidebar"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          <button
            onClick={handleCreateSession}
            disabled={isCreatingSession}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            {isCreatingSession ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "+ New Session"
            )}
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <SessionList
            userId={user.uid}
            selectedSessionId={selectedSessionId}
            onSelectSession={(id) => {
              setSelectedSessionId(id);
              setSidebarOpen(false);
            }}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto w-full">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:border-gray-800 dark:bg-gray-900/95">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-4 w-4 text-gray-600 dark:text-gray-200" />
            Sessions
          </button>
          <div className="rounded-lg bg-white/80 p-0.5 ring-1 ring-gray-200 dark:bg-gray-900/80 dark:ring-gray-700">
            <ThemeToggle />
          </div>
        </div>
        {selectedSessionId ? (
          <SessionView sessionId={selectedSessionId} userId={user.uid} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Select a session or create a new one
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Get started by creating your first flashcard session
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
