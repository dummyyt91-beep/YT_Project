import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/mongoose";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { Collection } from "@/models/Collection";
import { Message } from "@/models/Message";
import { User } from "@/models/User";

const genAI = new GoogleGenerativeAI("AIzaSyBwWJlPfhvo9gb6R4nW2KHFS01N1tvYVdQ");

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, transcript, collectionId } = await request.json();

    if (!message || !transcript) {
      return NextResponse.json(
        { error: "Message and transcript are required" },
        { status: 400 }
      );
    }

    // Convert transcript to text
    const transcriptText = transcript
      .map((item: any) => {
        const timestamp = item.start
          ? `[${Math.floor(item.start / 60)}:${(item.start % 60)
              .toFixed(0)
              .padStart(2, "0")}]`
          : ""
        return `${timestamp} ${item.text}`;
      })
      .join("\n");

    // System prompt for the AI
    const systemPrompt = `You are an AI assistant specialized in analyzing YouTube video transcripts. You have been provided with a complete transcript of a video, and your job is to help users understand, analyze, and extract insights from this content.

Your capabilities include:
- Summarizing the main points and key takeaways
- Answering specific questions about the content
- Identifying themes, topics, and important concepts
- Analyzing sentiment and tone
- Extracting quotes and specific information
- Providing timestamps when relevant
- Offering different perspectives on the content

Guidelines:
- Be accurate and base your responses only on the provided transcript
- When referencing specific parts, include timestamps if available
- Be concise but comprehensive in your answers
- If asked about something not covered in the transcript, clearly state that
- Maintain a helpful and professional tone
- For summaries, focus on the most important and actionable information

Here is the transcript you'll be working with:

${transcriptText}

Now, please respond to the user's question or request.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User question: ${message}` },
    ]);

    const response = await result.response;
    const text = response.text();

    // Persist messages if collectionId provided
    if (collectionId) {
      try {
        console.log("Attempting to save messages for collection:", collectionId);
        await connectDB();
        
        // Verify the collection exists
        const collection = await Collection.findById(collectionId);
        if (!collection) {
          console.error("Collection not found:", collectionId);
          return NextResponse.json(
            { error: "Collection not found" },
            { status: 404 }
          );
        }

        // Get user and check attempts
        const user = await User.findById(payload.userId);
        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const canUse =
          user.plan === "enterprise" ||
          (user.plan === "pro" && user.attemptsRemaining > 0) ||
          (user.plan === "free" && user.attemptsRemaining > 0);
        
        if (!canUse) {
          return NextResponse.json(
            { error: "No attempts remaining. Upgrade your plan." },
            { status: 403 }
          );
        }

        console.log("Collection found, creating messages...");

        // Create both messages in a single transaction
        const userMessage = {
          collectionId,
          userId: payload.userId,
          role: "user",
          content: message,
          timestamp: new Date(),
        };

        const assistantMessage = {
          collectionId,
          userId: payload.userId,
          role: "assistant",
          content: text,
          timestamp: new Date(),
        };

        // Store both messages in a single operation
        await Message.insertMany([userMessage, assistantMessage]);

        // Decrement attempts for non-enterprise users
        if (user.plan !== "enterprise") {
          user.attemptsRemaining = Math.max(0, (user.attemptsRemaining || 0) - 1);
          await user.save();
        }

        console.log("Messages saved successfully");

      } catch (dbError: any) {
        console.error("Database error saving messages:", dbError);
        console.error("Error details:", {
          message: dbError.message,
          stack: dbError.stack,
          collectionId,
          userId: payload.userId
        });
        // Don't fail the entire request if message saving fails
        // but log the error for debugging
      }
    } else {
      console.log("No collectionId provided, skipping message persistence");
    }

    // Return the response with attempts remaining if user was found
    const responseData: any = { response: text };
    
    // If we accessed the user, include their attempts remaining
    if (collectionId && payload) {
      try {
        const updatedUser = await User.findById(payload.userId);
        if (updatedUser) {
          responseData.attemptsRemaining = updatedUser.attemptsRemaining;
          responseData.plan = updatedUser.plan;
        }
      } catch (error) {
        console.error("Error fetching updated user data:", error);
      }
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response. Please try again." },
      { status: 500 }
    );
  }
}
