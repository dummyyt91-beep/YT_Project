import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { Message } from "@/models/Message";
import { Collection } from "@/models/Collection";

export async function POST(request: NextRequest) {
  try {
    console.log("Testing message creation...");
    
    await connectDB();
    console.log("Database connected successfully");
    
    // Try to find a collection to test with
    const collections = await Collection.find().limit(1);
    console.log("Found collections:", collections.length);
    
    if (collections.length === 0) {
      return NextResponse.json({ error: "No collections found to test with" }, { status: 400 });
    }
    
    const testCollection = collections[0];
    console.log("Using test collection:", testCollection._id);
    
    // Try to create a test message
    const testMessage = await Message.create({
      collectionId: testCollection._id,
      userId: testCollection.userId, // Use the collection's userId
      role: "user",
      content: "This is a test message to verify database functionality",
      timestamp: new Date(),
    });
    
    console.log("Test message created successfully:", testMessage._id);
    
    // Verify the message was saved by fetching it
    const savedMessage = await Message.findById(testMessage._id);
    console.log("Retrieved saved message:", savedMessage);
    
    // Clean up - delete the test message
    await Message.findByIdAndDelete(testMessage._id);
    console.log("Test message cleaned up");
    
    return NextResponse.json({ 
      success: true, 
      message: "Message creation test passed",
      testMessageId: testMessage._id,
      collectionId: testCollection._id
    });
    
  } catch (error: any) {
    console.error("Test message creation failed:", error);
    return NextResponse.json({ 
      error: "Test failed", 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
