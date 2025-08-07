import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI('AIzaSyBwWJlPfhvo9gb6R4nW2KHFS01N1tvYVdQ')

export async function POST(request: NextRequest) {
  try {
    const { message, transcript } = await request.json()

    if (!message || !transcript) {
      return NextResponse.json({ error: 'Message and transcript are required' }, { status: 400 })
    }

    // Convert transcript to text
    const transcriptText = transcript.map((item: any) => {
      const timestamp = item.start ? `[${Math.floor(item.start / 60)}:${(item.start % 60).toFixed(0).padStart(2, '0')}]` : ''
      return `${timestamp} ${item.text}`
    }).join('\n')

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

Now, please respond to the user's question or request.`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User question: ${message}` }
    ])

    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response. Please try again.' },
      { status: 500 }
    )
  }
}
