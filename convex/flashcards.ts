import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Flashcard = {
  front: string;
  back: string;
};

type FlashcardResult = {
  topic: string;
  flashcards: Flashcard[];
};

const MAX_OCR_RETRIES = 2;
const MAX_GEN_RETRIES = 2;

function isMeaningful(text?: string | null) {
  return typeof text === "string" && text.trim().length > 20;
}

function normalizeAndFilterFlashcards(cards: Flashcard[]): Flashcard[] {
  const seen = new Set<string>();

  return cards
    .map((c) => ({
      front: (c.front || "").trim(),
      back: (c.back || "").trim(),
    }))
    .filter((c) => c.front.length >= 12 && c.back.length >= 12)
    .filter((c) => c.front.endsWith("?"))
    .filter((c) => !/^what is key point/i.test(c.front))
    .filter((c) => !/^key concept/i.test(c.front))
    .filter((c) => {
      const key = c.front.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildFallbackFlashcards(notesText: string): FlashcardResult {
  const chunks = notesText
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 24)
    .slice(0, 8);

  return {
    topic: "Study Notes",
    flashcards: chunks.map((chunk, index) => ({
      front: `Issue transcribing image, ensure image is clear`,
      back: chunk,
    })),
  };
}

export const generateFlashcards = action({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
  },

  handler: async (ctx, { sessionId, userId }) => {
    if (!userId) throw new Error("UNAUTHENTICATED");

    const session = await ctx.runQuery(api.sessions.getSession, {
      sessionId,
      userId,
    });

    if (!session || session.userId !== userId) {
      throw new Error("SESSION_NOT_FOUND");
    }

    if (!session.imageUrls?.length) {
      throw new Error("NO_IMAGES");
    }

    await ctx.runMutation(api.sessions.updateSessionStatus, {
      sessionId,
      userId,
      status: "generating",
    });

    try {
      /* ==============================
         1️⃣ OCR PHASE (isolated + safe)
      =============================== */

      const extractedPages: string[] = [];

      for (const imageUrl of session.imageUrls) {
        let extracted: string | null = null;

        for (let attempt = 0; attempt < MAX_OCR_RETRIES; attempt++) {
          try {
            const res = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              temperature: 0,
              max_tokens: 1500,
              messages: [
                {
                  role: "system",
                  content:
                    "You transcribe handwritten academic notes. " +
                    "Return only the extracted text. No explanations.",
                },
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Transcribe this page exactly." },
                    {
                      type: "image_url",
                      image_url: { url: imageUrl },
                    },
                  ],
                },
              ],
            });

            const content = res.choices[0]?.message?.content ?? "";
            if (isMeaningful(content)) {
              extracted = content.trim();
              break;
            }
          } catch {
            // retry silently
          }
        }

        if (extracted) extractedPages.push(extracted);
      }

      const notesText = extractedPages.join("\n\n").trim();

      if (!isMeaningful(notesText)) {
        throw new Error("OCR_FAILED");
      }

      /* ==============================
         2️⃣ FLASHCARD GENERATION
      =============================== */

      let parsed: FlashcardResult | null = null;

      for (let attempt = 0; attempt < MAX_GEN_RETRIES; attempt++) {
        try {
          const response = await openai.responses.parse({
            model: "gpt-4o-mini",
            temperature: 0,
            input: [
              {
                role: "system",
                content:
                  "You create memorizable study flashcards. " +
                  "Every front must be a clear question ending with '?'. " +
                  "Every back must be a direct concise answer (1-3 sentences). " +
                  "Avoid generic cards and duplicates. " +
                  "Return only valid JSON matching schema.",
              },
              {
                role: "user",
                content:
                  "Create 8-15 exam-ready question-and-answer flashcards from these notes.\n\n" +
                  notesText.slice(0, 12000), // prevent token explosion
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "flashcards_schema",
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    topic: { type: "string" },
                    flashcards: {
                      type: "array",
                      minItems: 1,
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          front: { type: "string" },
                          back: { type: "string" },
                        },
                        required: ["front", "back"],
                      },
                    },
                  },
                  required: ["topic", "flashcards"],
                },
              },
            },
          });

          parsed = response.output_parsed as unknown as FlashcardResult;

          if (parsed?.flashcards?.length) {
            const filtered = normalizeAndFilterFlashcards(parsed.flashcards);
            if (filtered.length >= 6) {
              parsed = {
                topic: (parsed.topic || "Study Notes").trim(),
                flashcards: filtered,
              };
              break;
            }
          }
        } catch {
          // retry
        }
      }

      if (!parsed || !parsed.flashcards?.length) {
        // Secondary generation fallback using chat completions JSON mode.
        try {
          const fallbackRes = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You create memorizable study flashcards. " +
                  "Return JSON only with keys: topic, flashcards[].front, flashcards[].back. " +
                  "Every front must be a question ending with '?'.",
              },
              {
                role: "user",
                content:
                  "Create 8-15 exam-ready question-and-answer flashcards from these notes.\n\n" +
                  notesText.slice(0, 12000),
              },
            ],
          });

          const raw = fallbackRes.choices[0]?.message?.content ?? "";
          const candidate = JSON.parse(raw) as Partial<FlashcardResult>;
          if (candidate?.flashcards?.length) {
            const filtered = normalizeAndFilterFlashcards(candidate.flashcards as Flashcard[]);
            if (filtered.length >= 6) {
              parsed = {
                topic: candidate.topic?.trim() || "Study Notes",
                flashcards: filtered,
              };
            }
          }
        } catch {
          // final fallback below
        }
      }

      if (!parsed || !parsed.flashcards?.length) {
        parsed = buildFallbackFlashcards(notesText);
        parsed.flashcards = normalizeAndFilterFlashcards(parsed.flashcards);
      }

      if (!parsed.flashcards.length) {
        throw new Error("GENERATION_FAILED");
      }

      /* ==============================
         3️⃣ SAVE RESULT
      =============================== */

      await ctx.runMutation(api.sessions.updateSessionWithFlashcards, {
        sessionId,
        userId,
        flashcards: parsed.flashcards,
        topic: parsed.topic,
        title: parsed.topic.trim() || "Untitled",
        status: "completed",
      });

      return parsed;
    } catch (error: any) {
      await ctx.runMutation(api.sessions.updateSessionStatus, {
        sessionId,
        userId,
        status: "error",
      });

      if (error?.status === 429) {
        throw new Error("RATE_LIMITED");
      }

      if (error?.code === "insufficient_quota") {
        throw new Error("QUOTA_EXCEEDED");
      }

      throw new Error(error?.message ?? "FLASHCARD_ERROR");
    }
  },
});
