import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createSession = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sessionId = await ctx.db.insert("sessions", {
      userId,
      title: args.title || `Session ${new Date().toLocaleDateString()}`,
      createdAt: Date.now(),
      imageUrls: [],
      status: "pending",
    });

    return sessionId;
  },
});

export const getSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) {
      return [];
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return sessions;
  },
});

export const getSession = query({
  args: { sessionId: v.id("sessions"), userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    return session;
  },
});

export const addImages = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
    imageUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    if (session.imageUrls.length + args.imageUrls.length > 50) {
      throw new Error("Maximum 50 images allowed");
    }

    await ctx.db.patch(args.sessionId, {
      imageUrls: [...session.imageUrls, ...args.imageUrls],
    });
  },
});

export const updateSessionStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      status: args.status,
    });
  },
});

export const updateSessionWithFlashcards = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
    flashcards: v.array(
      v.object({
        front: v.string(),
        back: v.string(),
      })
    ),
    topic: v.string(),
    title: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      flashcards: args.flashcards,
      topic: args.topic,
      ...(args.title ? { title: args.title } : {}),
      status: args.status,
    });
  },
});
