import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Attempt to fetch URL with reasonable timeout and standard browser User-Agent
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    let html = ''
    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      html = await response.text()
    } catch (e: any) {
      // If fetching external site fails, fallback gracefully to domain-based metadata
      return NextResponse.json({
        metadata: {
          title: parsedUrl.hostname,
          description: `Content from ${parsedUrl.hostname}`,
          sourceLink: parsedUrl.toString(),
          domain: parsedUrl.hostname,
          images: [],
        },
      })
    } finally {
      clearTimeout(timeout)
    }

    // Extract OpenGraph / Meta tags via RegEx
    const getMeta = (prop: string) => {
      const match =
        html.match(new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)?${prop}["']`, 'i'))
      return match ? match[1] : null
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = getMeta('title') || (titleMatch ? titleMatch[1].trim() : parsedUrl.hostname)
    const description = getMeta('description') || ''
    
    // Extract images: og:image, twitter:image, and img src tags
    const images: string[] = []
    const ogImage = getMeta('image')
    if (ogImage) {
      try {
        images.push(new URL(ogImage, parsedUrl).toString())
      } catch {}
    }

    const imgRegex = /<img[^>]+src=["']([^"']+\.(?:png|jpe?g|webp|gif))(?:\?[^"']*)?["']/gi
    let match: RegExpExecArray | null
    while ((match = imgRegex.exec(html)) !== null && images.length < 8) {
      try {
        const resolved = new URL(match[1], parsedUrl).toString()
        if (!images.includes(resolved) && !resolved.includes('tracking') && !resolved.includes('pixel')) {
          images.push(resolved)
        }
      } catch {}
    }

    return NextResponse.json({
      metadata: {
        title,
        description,
        sourceLink: parsedUrl.toString(),
        domain: parsedUrl.hostname,
        images,
      },
    })
  } catch (error) {
    console.error('Error scraping link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
