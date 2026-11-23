import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    const trending = [
      'Modern Living Room Inspo',
      'Scandinavian Lounge Chair',
      'Holiday Appetizers & Mocktails',
      'Japandi Floating Credenza',
      'Artisan Sourdough Focaccia',
      'Minimalist Ceramic Coffee',
      'DIY Custom Furniture',
    ]

    // Topic guide chips mapping for popular queries
    const filterChipsMap: Record<string, string[]> = {
      default: ['Modern', 'Cozy', 'Minimalist', 'Aesthetic', 'Warm', 'Apartment', 'DIY'],
      living: ['Modern', 'Minimalist', 'Cozy', 'Scandinavian', 'Small spaces', 'Neutral'],
      chair: ['Oak wood', 'Lounge', 'Bouclé', 'Minimalist', 'Vintage', 'Modern'],
      food: ['Appetizers', 'Festive', 'Holiday', 'Mocktails', 'Sourdough', 'Easy'],
      drink: ['Mocktails', 'Cocktails', 'Holiday', 'Rosemary', 'Citrus', 'Party'],
      furniture: ['Japandi', 'White Oak', 'Credenza', 'Handcrafted', 'Slatted', 'DIY'],
    }

    if (!q) {
      return NextResponse.json({
        suggestions: trending.slice(0, 5),
        trending,
        chips: filterChipsMap.default,
      })
    }

    // Match pin titles from database
    const matchingPins = await prisma.pin.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 6,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        category: true,
      },
    })

    const suggestions = matchingPins.map((p) => p.title)

    // Determine relevant chips
    const lowerQ = q.toLowerCase()
    let chips = filterChipsMap.default
    for (const [key, chipList] of Object.entries(filterChipsMap)) {
      if (lowerQ.includes(key)) {
        chips = chipList
        break
      }
    }

    return NextResponse.json({
      query: q,
      suggestions: Array.from(new Set(suggestions)),
      chips,
      previewPins: matchingPins.slice(0, 3),
    })
  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}
