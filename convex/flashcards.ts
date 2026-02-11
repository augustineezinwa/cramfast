import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      // MVP: combine all images into one extraction request
      const combinedNotes: string[] = [];

      for (const imageUrl of session.imageUrls) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract all text from this handwritten note page. Preserve formatting as much as possible.",
                  },
                  {
                    type: "image_url",
                    image_url: { url: imageUrl },
                  },
                ],
              },
            ],
            max_tokens: 2000,
          });
          const text = response.choices[0]?.message?.content || "";
          combinedNotes.push(text);
        } catch (imgError: any) {
          console.error("Error extracting text from image:", imgError?.message);
          combinedNotes.push(""); // continue even if one image fails
        }
      }

      const notesText = combinedNotes.join("\n\n");

      // Generate flashcards
      const flashcardPrompt = `
You are an AI study assistant. Convert the notes into exam-ready flashcards.
Return ONLY valid JSON in this format:
{
  "topic": "Topic name",
  "flashcards": [
    { "front": "Question 1", "back": "Answer 1" }
  ]
}
Notes:
${notesText}
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: flashcardPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
      const topic = result.topic || "Untitled";
      const flashcards = result.flashcards || [];

      // Save flashcards
      await ctx.runMutation(api.sessions.updateSessionWithFlashcards, {
        sessionId,
        userId,
        flashcards,
        topic,
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

