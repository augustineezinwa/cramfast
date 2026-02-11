import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OCR_FAILURE_PATTERNS = [
  "unable to extract text",
  "can't extract text",
  "cannot extract text",
  "image is unclear",
  "cannot read",
  "can't read",
  "not legible",
  "no text found",
];

const REFUSAL_PATTERNS = [
  "i'm sorry",
  "i cannot assist",
  "i can't assist",
  "i can't help with that",
  "i cannot help with that",
  "as an ai",
  "i must refuse",
];

function looksLikeOcrFailure(text: string) {
  const normalized = text.toLowerCase();
  return OCR_FAILURE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function looksLikeRefusal(text: string) {
  const normalized = text.toLowerCase();
  return REFUSAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export const generateFlashcards = action({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, sessionId } = args;
    if (!userId) throw new Error("Not authenticated");

    // Get session
    const session = await ctx.runQuery(api.sessions.getSession, { sessionId, userId });
    if (!session || session.userId !== userId) throw new Error("Session not found");
    if (session.imageUrls.length === 0) throw new Error("No images uploaded");

    // Update status to generating
    await ctx.runMutation(api.sessions.updateSessionStatus, { sessionId, userId, status: "generating" });

    try {
      // Extract text page-by-page with retry.
      const extractedPages: Array<{ page: number; text: string }> = [];

      for (const [index, imageUrl] of session.imageUrls.entries()) {
        try {
          let extracted = "";

          for (let attempt = 1; attempt <= 2; attempt++) {
            const response = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text:
                        "You are an OCR transcriber for handwritten study notes. " +
                        "Return only the exact transcribed text from this page. " +
                        "Do not give advice or explanations. If some words are unclear, mark with [illegible]. " +
                        "Keep bullets, headings, formulas, and numbering.",
                    },
                    {
                      type: "image_url",
                      image_url: { url: imageUrl },
                    },
                  ],
                },
              ],
              max_tokens: 2000,
              temperature: 0,
            });

            extracted = (response.choices[0]?.message?.content || "").trim();
            if (extracted && !looksLikeOcrFailure(extracted)) break;
          }

          // Keep only meaningful text blocks.
          if (extracted && !looksLikeOcrFailure(extracted)) {
            extractedPages.push({ page: index + 1, text: extracted });
          }
        } catch (imgError: any) {
          console.error("Error extracting text from image:", imgError?.message);
          // Continue even if one image fails.
        }
      }

      const notesText = extractedPages
        .map((p) => `--- PAGE ${p.page} START ---\n${p.text}\n--- PAGE ${p.page} END ---`)
        .join("\n\n")
        .trim();
      if (!notesText) {
        throw new Error(
          "Could not extract readable text from the uploaded images. " +
          "Please upload clearer photos (good lighting, less blur, closer crop, and straight pages)."
        );
      }

      // Generate flashcards
      const flashcardPrompt = `
You are an AI study assistant. Convert the notes into exam-ready flashcards.
The notes are segmented by page markers. Use content from ALL pages and do not ignore earlier pages.
If a page has useful text, include at least one flashcard from that page.

Return ONLY valid JSON in this format:
{
  "topic": "Topic name",
  "pages": [
    {
      "page": 1,
      "flashcards": [
        { "front": "Question 1", "back": "Answer 1" }
      ]
    }
  ]
}

Notes:
${notesText}
      `;

      let parsedResult: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a flashcard generator for study notes. " +
                "Return ONLY JSON with keys: topic, flashcards. " +
                "Do not include disclaimers, refusals, markdown, or extra text.",
            },
            { role: "user", content: flashcardPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });

        const raw = (completion.choices[0]?.message?.content || "").trim();
        if (!raw || looksLikeRefusal(raw)) {
          continue;
        }

        try {
          const candidate = JSON.parse(raw);
          const pageGroups = Array.isArray(candidate?.pages) ? candidate.pages : [];
          const flatFromPages = pageGroups.flatMap((group: any) =>
            Array.isArray(group?.flashcards) ? group.flashcards : []
          );
          const fallbackFlat = Array.isArray(candidate?.flashcards) ? candidate.flashcards : [];
          const normalizedFlashcards = (flatFromPages.length > 0 ? flatFromPages : fallbackFlat).filter(
            (f: any) => typeof f?.front === "string" && typeof f?.back === "string"
          );

          if (normalizedFlashcards.length > 0) {
            parsedResult = {
              topic: candidate?.topic || "Untitled",
              flashcards: normalizedFlashcards,
            };
            break;
          }
        } catch {
          // retry once if malformed JSON
        }
      }

      if (!parsedResult) {
        throw new Error(
          "Model returned an unusable response. Please retry generation with clearer notes."
        );
      }

      const topic = parsedResult.topic || "Untitled";
      const flashcards = parsedResult.flashcards || [];
      const sessionTitle = topic.trim() || "Untitled";

      // Save flashcards
      await ctx.runMutation(api.sessions.updateSessionWithFlashcards, {
        sessionId,
        userId,
        flashcards,
        topic,
        title: sessionTitle,
        status: "completed",
      });

      return { topic, flashcards };
    } catch (error: any) {
      console.error("Flashcard generation error:", error);

      // Mark session as error
      await ctx.runMutation(api.sessions.updateSessionStatus, { sessionId, userId, status: "error" });

      if (error?.status === 429) {
        throw new Error("OpenAI API quota exceeded. Please try again later.");
      }
      throw new Error(error?.message || "Unknown error generating flashcards");
    }
  },
});

