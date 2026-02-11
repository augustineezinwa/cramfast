"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v2 as cloudinary } from "cloudinary";

export const uploadImagesToCloudinary = action({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
    imagesBase64: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, userId, imagesBase64 } = args;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.runQuery(api.sessions.getSession, { sessionId, userId });
    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    if (session.imageUrls.length + imagesBase64.length > 50) {
      throw new Error("Maximum 50 images allowed");
    }

    if (!process.env.CLOUDINARY_URL) {
      throw new Error("Missing CLOUDINARY_URL. Please set CLOUDINARY_URL in Convex environment variables.");
    }

    const uploadedUrls: string[] = [];

    for (const imageData of imagesBase64) {
      if (!imageData.startsWith("data:image/")) {
        throw new Error("Invalid image format. Upload a valid image file.");
      }

      const result = await cloudinary.uploader.upload(imageData, {
        folder: `cramfast/${userId}/${sessionId}`,
        resource_type: "image",
      });

      if (!result.secure_url) {
        throw new Error("Cloudinary upload failed: no secure URL returned.");
      }

      uploadedUrls.push(result.secure_url);
    }

    await ctx.runMutation(api.sessions.addImages, {
      sessionId,
      userId,
      imageUrls: uploadedUrls,
    });

    return uploadedUrls;
  },
});
