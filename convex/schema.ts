import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    createdAt: v.number(),
    generationMode: v.optional(v.union(v.literal("help_understand"), v.literal("generate_qa"))),
    imageUrls: v.array(v.string()),
    flashcards: v.optional(
      v.array(
        v.object({
          front: v.string(),
          back: v.string(),
        })
      )
    ),
    topic: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("error")),
  })
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),
});
