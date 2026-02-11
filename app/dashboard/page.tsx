"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionList } from "@/components/SessionList";
import { SessionView } from "@/components/SessionView";
import { signOut } from "@/lib/auth";
import { Loader2, LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);
  const createSession = useMutation(api.sessions.createSession);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleCreateSession = async () => {
    if (!user) return;
    try {
      const sessionId = await createSession({
        userId: user.uid,
      });
      setSelectedSessionId(sessionId);
    } catch (error) {
      console.error("Failed to create session:", error);
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CramFast
            </h1>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={handleCreateSession}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + New Session
          </button>
        </div>
        <SessionList
          userId={user.uid}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {selectedSessionId ? (
          <SessionView sessionId={selectedSessionId} userId={user.uid} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Select a session or create a new one
              </h2>
              <p className="text-gray-500">Get started by creating your first flashcard session</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
