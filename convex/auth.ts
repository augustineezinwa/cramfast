import { query } from "./_generated/server";
import { v } from "convex/values";

// Simple auth query that accepts Firebase user ID
export const getUserId = query({
  args: { firebaseUserId: v.string() },
  handler: async (ctx, args) => {
    // In a real app, you'd verify the Firebase token here
    // For MVP, we'll trust the client-provided user ID
    return args.firebaseUserId;
  },
});
