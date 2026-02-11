"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const convex = useMemo(() => {
    try {
      if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
      return new ConvexReactClient(convexUrl);
    } catch (error) {
      console.error("Failed to create Convex client:", error);
      throw error;
    }
  }, [convexUrl]);

  if (!convexUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Configuration Error</h1>
          <p className="text-gray-700 mb-4">
            Missing NEXT_PUBLIC_CONVEX_URL environment variable.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Please set it in your .env.local file. Run <code className="bg-gray-100 px-2 py-1 rounded">npx convex dev</code> to get your Convex URL.
          </p>
        </div>
      </div>
    );
  }

  // Validate URL format
  if (!convexUrl.startsWith("https://") || !convexUrl.includes(".convex.")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Invalid Convex URL</h1>
          <p className="text-gray-700 mb-4">
            The Convex URL format appears to be incorrect.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Expected format: <code className="bg-gray-100 px-2 py-1 rounded">https://your-project.convex.cloud</code>
          </p>
          <p className="text-sm text-gray-600">
            Current value: <code className="bg-gray-100 px-2 py-1 rounded break-all">{convexUrl}</code>
          </p>
        </div>
      </div>
    );
  }


  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
