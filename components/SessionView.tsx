"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ImageUpload } from "@/components/ImageUpload";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { Loader2, Sparkles, AlertCircle, Mail } from "lucide-react";

interface SessionViewProps {
  sessionId: Id<"sessions">;
  userId: string;
}

export function SessionView({ sessionId, userId }: SessionViewProps) {
  const session = useQuery(api.sessions.getSession, { sessionId, userId });
  const addImages = useMutation(api.sessions.addImages);
  const generateFlashcards = useAction(api.flashcards.generateFlashcards);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleImageUpload = async (imageUrls: string[]) => {
    try {
      await addImages({
        sessionId,
        userId,
        imageUrls,
      });
    } catch (error) {
      console.error("Failed to add images:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  const handleGenerate = async () => {
    if (!session || session.imageUrls.length === 0) {
      alert("Please upload at least one image first");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setErrorDetails(null);

    try {
      await generateFlashcards({
        sessionId,
        userId,
      });
      // The session will automatically update via the query
      setIsGenerating(false);
    } catch (error: any) {
      console.error("Failed to generate flashcards:", error);
      const errorString = error?.message || String(error) || "Unknown error";
      setErrorMessage("An error occurred during generation");
      setErrorDetails(errorString);
      setIsGenerating(false);
    }
  };

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{session.title}</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {session.imageUrls.length} / 50 images uploaded
          </span>
          {session.status === "completed" && session.topic && (
            <span className="text-sm text-gray-600 dark:text-gray-300">Topic: {session.topic}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {session.status === "completed" && session.flashcards ? (
          <FlashcardViewer flashcards={session.flashcards} topic={session.topic || ""} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <ImageUpload
              onUpload={handleImageUpload}
              existingImages={session.imageUrls}
              maxImages={50}
            />

            {session.imageUrls.length > 0 && (
              <div className="mt-6 space-y-4">
                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/30 dark:border-red-900/50">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 dark:text-red-300 mb-1">Error</h4>
                        <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                      </div>
                    </div>
                    {errorDetails && (
                      <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-900/60">
                        <a
                          href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@cramfast.app"}?subject=Flashcard Generation Error&body=Error Details:%0D%0A%0D%0A${encodeURIComponent(errorDetails)}%0D%0A%0D%0ASession ID: ${sessionId}%0D%0AUser ID: ${userId}%0D%0ATimestamp: ${new Date().toISOString()}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Send error to developer
                        </a>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || session.status === "generating"}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating || session.status === "generating" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Flashcards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Flashcards
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
