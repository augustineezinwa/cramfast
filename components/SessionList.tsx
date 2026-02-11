"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";

interface SessionListProps {
  userId: string;
  selectedSessionId: Id<"sessions"> | null;
  onSelectSession: (sessionId: Id<"sessions">) => void;
}

export function SessionList({ userId, selectedSessionId, onSelectSession }: SessionListProps) {
  const sessions = useQuery(api.sessions.getSessions, { userId });

  if (sessions === undefined) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="animate-pulse">Loading sessions...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p>No sessions yet</p>
        <p className="text-sm mt-2">Create your first session to get started</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {sessions.map((session) => (
        <button
          key={session._id}
          onClick={() => onSelectSession(session._id)}
          className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            selectedSessionId === session._id ? "bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{session.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(session.createdAt), "MMM d, yyyy")}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {session.imageUrls.length} image{session.imageUrls.length !== 1 ? "s" : ""} •{" "}
                {session.flashcards?.length || 0} card{session.flashcards?.length !== 1 ? "s" : ""}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    session.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : session.status === "generating"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                      : session.status === "error"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {session.status}
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
