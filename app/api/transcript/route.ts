import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/
    if (!youtubeRegex.test(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Encode the URL for the API call
    const encodedUrl = encodeURIComponent(url)
    
    const response = await fetch(
      `https://youtube-2-transcript.p.rapidapi.com/transcript-with-url?url=${encodedUrl}&flat_text=false`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'youtube-2-transcript.p.rapidapi.com',
          'x-rapidapi-key': 'ffc936450dmshc2e2b7307f68378p186232jsna42db549b51e'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('RapidAPI Error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch transcript. Please check if the video has captions available.' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Check if transcript data exists
    if (!data || !data.transcript) {
      return NextResponse.json(
        { error: 'No transcript found for this video. The video might not have captions.' },
        { status: 404 }
      )
    }

    // Extract video title from URL (basic implementation)
    let title = 'YouTube Video'
    try {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
      if (videoId) {
        title = `Video ${videoId}`
      }
    } catch (e) {
      // Keep default title
    }

    return NextResponse.json({ 
      transcript: data.transcript,
      title: title
    })
  } catch (error) {
    console.error('Transcript API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching transcript' },
      { status: 500 }
    )
  }
}
