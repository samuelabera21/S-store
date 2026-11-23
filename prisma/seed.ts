import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment.')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('--- Starting database seed ---')

  // Clean existing seed data safely if needed
  await prisma.boardPin.deleteMany({})
  await prisma.board.deleteMany({})
  await prisma.pin.deleteMany({})
  await prisma.user.deleteMany({})

  console.log('Cleared existing records.')

  // 1. Create demo users
  const alice = await prisma.user.create({
    data: {
      username: 'alice_designer',
      email: 'alice@example.com',
      passwordHash: '$2b$10$localdevplaceholderhashforalicepassword1234567890',
      displayName: 'Alice Cooper',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  })

  const bob = await prisma.user.create({
    data: {
      username: 'bob_builder',
      email: 'bob@example.com',
      passwordHash: '$2b$10$localdevplaceholderhashforbobpassword1234567890',
      displayName: 'Bob Martinez',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
  })

  console.log(`Created users: ${alice.username}, ${bob.username}`)

  // 2. Create sample boards
  const homeDecorBoard = await prisma.board.create({
    data: {
      title: 'Modern Living Room Inspo',
      description: 'Warm minimalist interior ideas, earth tones, and cozy lighting.',
      isPrivate: false,
      userId: alice.id,
    },
  })

  const recipesBoard = await prisma.board.create({
    data: {
      title: 'Holiday Appetizers & Drinks',
      description: 'Delicious festive finger foods, mocktails, and cocktails.',
      isPrivate: false,
      userId: alice.id,
    },
  })

  const secretWishlist = await prisma.board.create({
    data: {
      title: 'Secret Gift Ideas 2026',
      description: 'Surprise wishlist for family and friends.',
      isPrivate: true,
      userId: alice.id,
    },
  })

  const bobWoodworking = await prisma.board.create({
    data: {
      title: 'Custom DIY Furniture',
      description: 'Handcrafted tables, shelves, and joinery guides.',
      isPrivate: false,
      userId: bob.id,
    },
  })

  console.log(`Created boards: ${homeDecorBoard.title}, ${recipesBoard.title}, ${secretWishlist.title}, ${bobWoodworking.title}`)

  // 3. Create sample pins with varying aspect ratios (ideal for masonry testing)
  const pin1 = await prisma.pin.create({
    data: {
      title: 'Minimalist Scandinavian Lounge Chair',
      description: 'Natural oak wood frame with bouclé upholstery in cream beige.',
      imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop',
      imageWidth: 800,
      imageHeight: 1200,
      sourceLink: 'https://example.com/furniture/scandi-chair',
      userId: alice.id,
    },
  })

  const pin2 = await prisma.pin.create({
    data: {
      title: 'Spiced Rosemary Pomegranate Mocktail',
      description: 'Festive holiday sparkle with fresh herbs, ginger beer, and citrus zest.',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop',
      imageWidth: 800,
      imageHeight: 1000,
      sourceLink: 'https://example.com/recipes/pomegranate-mocktail',
      userId: alice.id,
    },
  })

  const pin3 = await prisma.pin.create({
    data: {
      title: 'Modern Japandi Floating Credenza',
      description: 'Slatted tambour sliding doors crafted from white oak.',
      imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop',
      imageWidth: 800,
      imageHeight: 600,
      sourceLink: 'https://example.com/diy/credenza',
      userId: bob.id,
    },
  })

  const pin4 = await prisma.pin.create({
    data: {
      title: 'Artisan Sourdough Focaccia with Rosemary',
      description: 'Golden olive oil crust with sea salt flakes and garden herbs.',
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop',
      imageWidth: 800,
      imageHeight: 1100,
      sourceLink: 'https://example.com/recipes/artisan-focaccia',
      userId: alice.id,
    },
  })

  const pin5 = await prisma.pin.create({
    data: {
      title: 'Ceramic Pour-Over Coffee Dripper Set',
      description: 'Matte black stoneware dripper with handcrafted walnut stand.',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop',
      imageWidth: 800,
      imageHeight: 1200,
      sourceLink: 'https://example.com/shop/coffee-dripper',
      userId: bob.id,
    },
  })

  console.log(`Created 5 sample pins with varying aspect ratios.`)

  // 4. Save pins to boards (BoardPin join entity)
  await prisma.boardPin.create({
    data: {
      boardId: homeDecorBoard.id,
      pinId: pin1.id,
      userId: alice.id,
    },
  })

  await prisma.boardPin.create({
    data: {
      boardId: recipesBoard.id,
      pinId: pin2.id,
      userId: alice.id,
    },
  })

  await prisma.boardPin.create({
    data: {
      boardId: recipesBoard.id,
      pinId: pin4.id,
      userId: alice.id,
    },
  })

  await prisma.boardPin.create({
    data: {
      boardId: bobWoodworking.id,
      pinId: pin3.id,
      userId: bob.id,
    },
  })

  // Cross-save: Alice also saves Bob's pin to her Home Decor board
  await prisma.boardPin.create({
    data: {
      boardId: homeDecorBoard.id,
      pinId: pin3.id,
      userId: alice.id,
    },
  })

  console.log('Created BoardPin associations (including cross-user save).')
  console.log('--- Database seed completed successfully! ---')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
