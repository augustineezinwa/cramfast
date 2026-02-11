"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  topic: string;
}

export function FlashcardViewer({ flashcards, topic }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashcards[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < flashcards.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{topic}</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
      </div>

      <div className="relative">
        {/* Flashcard */}
        <div
          onClick={handleFlip}
          className="relative h-96 cursor-pointer perspective-1000"
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative w-full h-full preserve-3d transition-transform duration-500"
            style={{
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 backface-hidden bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">Question</div>
                <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{currentCard.front}</div>
                <div className="mt-6 text-sm text-gray-400 dark:text-gray-500">Click to flip</div>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 rounded-xl shadow-xl p-8 flex items-center justify-center border-2 border-blue-200 dark:border-indigo-800 rotate-y-180"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="text-center">
                <div className="text-sm text-blue-600 dark:text-indigo-300 mb-4 uppercase tracking-wide font-medium">
                  Answer
                </div>
                <div className="text-xl text-gray-900 dark:text-gray-100">{currentCard.back}</div>
                <div className="mt-6 text-sm text-gray-400 dark:text-gray-500">Click to flip</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleFlip}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* All Cards List */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          All Flashcards ({flashcards.length})
        </h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {flashcards.map((card, index) => (
            <div
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
              className={`p-4 bg-white dark:bg-gray-900 rounded-lg border-2 cursor-pointer transition-colors ${
                index === currentIndex
                  ? "border-blue-500 bg-blue-50 dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{card.front}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{card.back}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
