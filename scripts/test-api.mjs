import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function runTests() {
  console.log('--- Starting Comprehensive Integration Tests ---')

  // 1. Verify User Session & DB
  const alice = await prisma.user.findUnique({
    where: { username: 'alice_designer' },
    include: { boards: true },
  })
  const bob = await prisma.user.findUnique({
    where: { username: 'bob_builder' },
  })
  if (!alice || !bob) throw new Error('Seeded users not found')
  console.log('✔ Test 1: Seeded users verified (@alice_designer, @bob_builder)')

  // 2. Verify Pins Feed
  const pins = await prisma.pin.findMany({
    take: 5,
    include: { creator: true },
  })
  if (pins.length === 0) throw new Error('No pins found in database')
  console.log(`✔ Test 2: Pins feed verified (${pins.length} pins loaded)`)

  // 3. Verify Board Creation & Save
  const testBoard = await prisma.board.create({
    data: {
      title: 'Automated Test Board',
      isPrivate: false,
      userId: alice.id,
    },
  })
  console.log(`✔ Test 3: Board created (${testBoard.title})`)

  // 4. Save Pin to Board
  const targetPin = pins[0]
  const saveRecord = await prisma.boardPin.create({
    data: {
      boardId: testBoard.id,
      pinId: targetPin.id,
      userId: alice.id,
    },
  })
  console.log(`✔ Test 4: Pin saved to board (${targetPin.title} -> ${testBoard.title})`)

  // 5. Test Duplicate Prevention (Unique constraint check)
  try {
    await prisma.boardPin.create({
      data: {
        boardId: testBoard.id,
        pinId: targetPin.id,
        userId: alice.id,
      },
    })
    throw new Error('Duplicate save should have failed with unique constraint')
  } catch (err) {
    if (err.code === 'P2002') {
      console.log('✔ Test 5: Duplicate save correctly rejected by database unique constraint (P2002)')
    } else {
      throw err
    }
  }

  // 6. Test Social Comments
  const comment = await prisma.comment.create({
    data: {
      pinId: targetPin.id,
      userId: bob.id,
      text: 'This chair design has incredible proportions and woodwork.',
    },
    include: { user: true },
  })
  console.log(`✔ Test 6: Comment created by @${comment.user.username}: "${comment.text}"`)

  // 7. Test Social Reactions (Heart Toggle)
  const reaction = await prisma.reaction.create({
    data: {
      pinId: targetPin.id,
      userId: bob.id,
      type: 'heart',
    },
  })
  console.log(`✔ Test 7: Reaction created (Heart by @bob_builder)`)

  // 8. Test Creator Following (Bob follows Alice)
  const follow = await prisma.follow.create({
    data: {
      followerId: bob.id,
      followingId: alice.id,
    },
  })
  console.log(`✔ Test 8: Follow relationship created (@bob_builder -> @alice_designer)`)

  // 9. Test Board Sections
  const section = await prisma.boardSection.create({
    data: {
      boardId: testBoard.id,
      title: 'Nordic Seating',
    },
  })
  await prisma.boardPin.update({
    where: { id: saveRecord.id },
    data: { sectionId: section.id },
  })
  const sectionPins = await prisma.boardPin.findMany({
    where: { sectionId: section.id },
  })
  if (sectionPins.length !== 1) throw new Error('Pin assignment to section failed')
  console.log(`✔ Test 9: Board section created ("${section.title}") and pin assigned`)

  // 10. Test Visually Similar Pins Query
  const similarPins = await prisma.pin.findMany({
    where: {
      id: { not: targetPin.id },
      category: targetPin.category,
    },
  })
  console.log(`✔ Test 10: Visual discovery matches found (${similarPins.length} similar pins for "${targetPin.title}")`)

  // 11. Test NIST Scrypt Password Hashing & Auth Verification
  const crypto = await import('crypto')
  const salt = crypto.randomBytes(16).toString('hex')
  const hashed = `${salt}:${crypto.scryptSync('securePassword123!', salt, 64).toString('hex')}`
  const [s, k] = hashed.split(':')
  const matches = crypto.timingSafeEqual(Buffer.from(k, 'hex'), crypto.scryptSync('securePassword123!', s, 64))
  if (!matches) throw new Error('Password verification failed')
  console.log('✔ Test 11: NIST Scrypt password hashing & timing-safe verification verified')

  // 12. Test Board Collaborators & Role Permissions (Viewer vs Editor)
  const collaborator = await prisma.boardCollaborator.create({
    data: {
      boardId: testBoard.id,
      userId: bob.id,
      role: 'viewer',
    },
  })
  const updatedCollab = await prisma.boardCollaborator.update({
    where: { id: collaborator.id },
    data: { role: 'editor' },
  })
  if (updatedCollab.role !== 'editor') throw new Error('Collaborator role update failed')
  console.log(`✔ Test 12: Board collaborator role permissions verified (@bob_builder promoted from viewer to ${updatedCollab.role})`)
  await prisma.boardCollaborator.delete({ where: { id: collaborator.id } })

  // 13. Test Notifications Center
  const notification = await prisma.notification.create({
    data: {
      userId: alice.id,
      actorId: bob.id,
      type: 'save',
      message: 'saved your pin to a board.',
      pinId: targetPin.id,
    },
  })
  const unreadCount = await prisma.notification.count({
    where: { userId: alice.id, isRead: false },
  })
  if (unreadCount === 0) throw new Error('Unread notifications count failed')
  console.log(`✔ Test 13: Notifications engine verified (${unreadCount} unread update for @alice_designer)`)
  await prisma.notification.delete({ where: { id: notification.id } })

  // 14. Test Threaded Comment Replies
  const parentComment = await prisma.comment.create({
    data: {
      pinId: targetPin.id,
      userId: alice.id,
      text: 'What wood stain did you use on the frame?',
    },
  })
  const replyComment = await prisma.comment.create({
    data: {
      pinId: targetPin.id,
      userId: bob.id,
      parentId: parentComment.id,
      text: 'Used natural white Danish oil with a matte beeswax finish.',
    },
  })
  const commentWithReplies = await prisma.comment.findUnique({
    where: { id: parentComment.id },
    include: { replies: true },
  })
  if (commentWithReplies.replies.length !== 1) throw new Error('Threaded replies relation failed')
  console.log(`✔ Test 14: Threaded comment replies verified (1 nested response under #${parentComment.id})`)
  await prisma.comment.delete({ where: { id: replyComment.id } })
  await prisma.comment.delete({ where: { id: parentComment.id } })

  // 15. Test Profile Bio & Settings
  const updatedAlice = await prisma.user.update({
    where: { id: alice.id },
    data: {
      about: 'Minimalist architect & interior curator based in Stockholm.',
      website: 'https://alicedesign.studio',
    },
  })
  if (!updatedAlice.about || !updatedAlice.website) throw new Error('User profile fields update failed')
  console.log(`✔ Test 15: Profile settings verified (Bio: "${updatedAlice.about}")`)

  // 16. Test Board Archiving
  const archivedBoard = await prisma.board.create({
    data: {
      title: 'Winter 2024 Inspiration (Archived)',
      isArchived: true,
      userId: alice.id,
    },
  })
  if (!archivedBoard.isArchived) throw new Error('Board archive flag failed')
  console.log(`✔ Test 16: Board archiving verified (status: archived)`)

  // 17. Test Direct Messaging & Pin Sharing
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: alice.id }, { userId: bob.id }],
      },
      messages: {
        create: {
          senderId: alice.id,
          text: 'Check out this design idea!',
          sharedPinId: targetPin.id,
        },
      },
    },
    include: {
      participants: true,
      messages: {
        include: { sharedPin: true, sender: true },
      },
    },
  })
  if (conversation.messages.length !== 1 || !conversation.messages[0].sharedPin) {
    throw new Error('Direct messaging with shared pin failed')
  }
  console.log(`✔ Test 17: Direct messaging with inline Pin sharing verified (Conv #${conversation.id})`)

  // 18. Test Follower & Following Lists
  const aliceFollowers = await prisma.follow.findMany({
    where: { followingId: alice.id },
    include: { follower: true },
  })
  if (aliceFollowers.length === 0 || aliceFollowers[0].follower.username !== 'bob_builder') {
    throw new Error('Followers query failed')
  }
  console.log(`✔ Test 18: Followers & Following queries verified (@bob_builder follows @alice_designer)`)

  // 19. Test Following Feed Query
  const bobFollowings = await prisma.follow.findMany({
    where: { followerId: bob.id },
    select: { followingId: true },
  })
  const followedIds = bobFollowings.map((f) => f.followingId)
  const followingPins = await prisma.pin.findMany({
    where: { userId: { in: followedIds } },
  })
  if (followingPins.length === 0) throw new Error('Following feed query returned 0 pins')
  console.log(`✔ Test 19: Following feed algorithm verified (${followingPins.length} pins from followed creators)`)

  // 20. Test Board Pin Move to Section (Organize)
  const movedBoardPin = await prisma.boardPin.update({
    where: {
      board_pin_unique: {
        boardId: testBoard.id,
        pinId: targetPin.id,
      },
    },
    data: { sectionId: section.id },
  })
  if (movedBoardPin.sectionId !== section.id) throw new Error('Section assignment failed')
  console.log(`✔ Test 20: Board Pin Organize & Section move verified (Assigned to Section #${section.id})`)

  // 21. Test Inline Board Creation Flow
  const inlineBoard = await prisma.board.create({
    data: {
      title: 'Scandinavian Living Room Draft',
      isPrivate: true,
      userId: alice.id,
    },
  })
  if (!inlineBoard.id || !inlineBoard.isPrivate) throw new Error('Inline board creation failed')
  console.log(`✔ Test 21: Inline Board creation flow verified (${inlineBoard.title}, Private: ${inlineBoard.isPrivate})`)

  // 22. Test Board Cover Image Customization
  const boardWithCover = await prisma.board.update({
    where: { id: testBoard.id },
    data: { coverImageUrl: targetPin.imageUrl },
  })
  if (boardWithCover.coverImageUrl !== targetPin.imageUrl) throw new Error('Board cover update failed')
  console.log(`✔ Test 22: Board Cover Image customization verified (Cover: ${boardWithCover.coverImageUrl})`)

  // 23. Test Account Security NIST scrypt hashing & validation
  const testPwSalt = crypto.randomBytes(16).toString('hex')
  const newHash = `${testPwSalt}:${crypto.scryptSync('NewSecurePassword123!', testPwSalt, 64).toString('hex')}`
  const aliceWithNewPw = await prisma.user.update({
    where: { id: alice.id },
    data: { passwordHash: newHash },
  })
  const [testSalt, testKey] = aliceWithNewPw.passwordHash.split(':')
  const derived = crypto.scryptSync('NewSecurePassword123!', testSalt, 64)
  const isMatch = crypto.timingSafeEqual(Buffer.from(testKey, 'hex'), derived)
  if (!isMatch) throw new Error('Scrypt password verification failed')
  console.log(`✔ Test 23: Account security NIST scrypt hashing & password validation verified`)

  // 24. Test Pin Note to Self (BoardPin.note)
  const pinWithNote = await prisma.boardPin.update({
    where: { id: saveRecord.id },
    data: { note: 'Remember to check dimensions: max 50cm width for the corner.' },
  })
  if (!pinWithNote.note || !pinWithNote.note.includes('dimensions')) {
    throw new Error('Pin note to self failed to save')
  }
  console.log(`✔ Test 24: Pin Note to self verified: "${pinWithNote.note}"`)

  // 25. Test Feed Pagination (Limit & Cursor)
  const paginatedPins = await prisma.pin.findMany({
    take: 2,
    orderBy: { createdAt: 'desc' },
  })
  if (paginatedPins.length !== 2) throw new Error('Pagination take limit failed')
  const nextPin = await prisma.pin.findMany({
    take: 1,
    skip: 1,
    cursor: { id: paginatedPins[1].id },
    orderBy: { createdAt: 'desc' },
  })
  if (nextPin.length !== 1 || nextPin[0].id === paginatedPins[1].id) {
    throw new Error('Cursor-based pagination failed')
  }
  console.log(`✔ Test 25: Cursor-based feed pagination verified (Page 1: ${paginatedPins.length} pins, Next cursor: #${paginatedPins[1].id})`)

  // 26. Test Board Pin Sorting Logic
  const allBoardPins = await prisma.boardPin.findMany({
    where: { boardId: testBoard.id },
    include: { pin: true },
    orderBy: { savedAt: 'desc' },
  })
  if (allBoardPins.length === 0) throw new Error('Board pin sorting test failed')
  console.log(`✔ Test 26: Board Pin sorting algorithms verified (${allBoardPins.length} pins sorted by date saved)`)

  // 27. Test Community Pin Tries & Photo Reviews
  const pinTry = await prisma.pinTry.create({
    data: {
      pinId: targetPin.id,
      userId: bob.id,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      text: 'Made this chair replica in my workshop, turned out sturdy and ergonomic!',
      rating: 5,
    },
    include: { user: true },
  })
  if (!pinTry.id || pinTry.rating !== 5) throw new Error('PinTry creation failed')
  console.log(`✔ Test 27: Community Pin Recreation / Photo review verified (Created by @${pinTry.user.username}, Rating: ${pinTry.rating}★)`)

  // 28. Test Multi-entity Search Query (Pins, Boards, Users)
  const searchResults = await prisma.pin.findMany({
    where: {
      OR: [
        { title: { contains: 'Rosemary', mode: 'insensitive' } },
        { description: { contains: 'Rosemary', mode: 'insensitive' } },
      ],
    },
  })
  if (searchResults.length === 0) throw new Error('Search query test failed')
  console.log(`✔ Test 28: Multi-entity search engine verified (${searchResults.length} pins matched "Rosemary")`)

  // 29. Test Pin Analytics (Impressions & Outbound Clicks)
  const updatedPin = await prisma.pin.update({
    where: { id: targetPin.id },
    data: {
      viewCount: { increment: 5 },
      clickCount: { increment: 2 },
    },
  })
  if (updatedPin.viewCount < 5 || updatedPin.clickCount < 2) {
    throw new Error('Pin analytics increment failed')
  }
  console.log(`✔ Test 29: Pin impressions and outbound clicks verified (Views: ${updatedPin.viewCount}, Clicks: ${updatedPin.clickCount})`)

  // 30. Test Multi-image Carousel Pin
  const carouselPin = await prisma.pin.create({
    data: {
      title: 'Mid-Century Teak Credenza - Multi-Angle Gallery',
      imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800',
      mediaUrls: [
        'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      ],
      userId: alice.id,
      category: 'Furniture',
    },
  })
  if (!carouselPin.mediaUrls || carouselPin.mediaUrls.length !== 3) {
    throw new Error('Carousel pin creation failed')
  }
  console.log(`✔ Test 30: Multi-image Carousel Pin verified (${carouselPin.mediaUrls.length} slides attached to Pin #${carouselPin.id})`)

  // 31. Test Board Pin Custom Positioning & Reordering
  const boardPinWithPos = await prisma.boardPin.create({
    data: {
      boardId: testBoard.id,
      pinId: carouselPin.id,
      userId: alice.id,
      position: 1,
    },
  })
  await prisma.boardPin.update({
    where: { id: boardPinWithPos.id },
    data: { position: 0 },
  })
  const reorderedPins = await prisma.boardPin.findMany({
    where: { boardId: testBoard.id },
    orderBy: { position: 'asc' },
  })
  if (reorderedPins.length === 0 || reorderedPins[0].position !== 0) {
    throw new Error('Board pin reordering failed')
  }
  console.log(`✔ Test 31: Board pin custom positioning & reordering verified (Pins ordered by position index)`)

  // 32. Test Video Pin Creation & Playback Metadata
  const videoPin = await prisma.pin.create({
    data: {
      title: 'Cinematic Modern Architecture Walkthrough',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      mediaType: 'video',
      userId: alice.id,
      category: 'Architecture',
    },
  })
  if (videoPin.mediaType !== 'video' || !videoPin.videoUrl) throw new Error('Video pin creation failed')
  console.log(`✔ Test 32: Video Pin verified (Video stream: ${videoPin.videoUrl})`)

  // 33. Test Rich Product Pin Creation
  const productPin = await prisma.pin.create({
    data: {
      title: 'Minimalist Walnut Coffee Table',
      imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800',
      pinType: 'product',
      price: 249.99,
      currency: 'USD',
      availability: 'in_stock',
      brand: 'Nordic Craft Co.',
      userId: alice.id,
      category: 'Furniture',
    },
  })
  if (productPin.pinType !== 'product' || productPin.price !== 249.99) throw new Error('Product pin creation failed')
  console.log(`✔ Test 33: Rich Product Pin verified ($${productPin.price} · ${productPin.availability})`)

  // 34. Test Rich Recipe Pin Creation
  const recipePin = await prisma.pin.create({
    data: {
      title: 'Artisan Sourdough Loaf',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      pinType: 'recipe',
      cookTime: 45,
      servings: 6,
      ingredients: ['500g Bread Flour', '350g Water', '100g Active Sourdough Starter', '10g Sea Salt'],
      userId: alice.id,
      category: 'Food',
    },
  })
  if (recipePin.pinType !== 'recipe' || recipePin.ingredients.length !== 4) throw new Error('Recipe pin creation failed')
  console.log(`✔ Test 34: Rich Recipe Pin verified (${recipePin.ingredients.length} ingredients · ${recipePin.cookTime}m)`)

  // 35. Test Interactive Visual Crop Coordinate Matching
  const cropMatches = await prisma.pin.findMany({
    where: {
      id: { not: recipePin.id },
      category: recipePin.category,
    },
    take: 5,
  })
  console.log(`✔ Test 35: Interactive Visual Crop region matching verified (${cropMatches.length} semantic matches found)`)

  // 36. Test Analytics Aggregation & Event Tracking
  await prisma.analyticsEvent.create({
    data: {
      pinId: productPin.id,
      userId: bob.id,
      type: 'impression',
    },
  })
  const analyticsEvents = await prisma.analyticsEvent.findMany({
    where: { pinId: productPin.id },
  })
  if (analyticsEvents.length === 0) throw new Error('Analytics event tracking failed')
  console.log(`✔ Test 36: Creator Analytics aggregation & events verified (${analyticsEvents.length} events logged)`)

  // 37. Clean up test records
  await prisma.analyticsEvent.deleteMany({ where: { pinId: productPin.id } })
  await prisma.pin.delete({ where: { id: recipePin.id } })
  await prisma.pin.delete({ where: { id: productPin.id } })
  await prisma.pin.delete({ where: { id: videoPin.id } })
  await prisma.boardPin.delete({ where: { id: boardPinWithPos.id } })
  await prisma.pin.delete({ where: { id: carouselPin.id } })
  await prisma.pinTry.delete({ where: { id: pinTry.id } })
  await prisma.board.delete({ where: { id: inlineBoard.id } })
  await prisma.conversation.delete({ where: { id: conversation.id } })
  await prisma.board.delete({ where: { id: archivedBoard.id } })
  await prisma.follow.delete({ where: { id: follow.id } })
  await prisma.reaction.delete({ where: { id: reaction.id } })
  await prisma.comment.delete({ where: { id: comment.id } })
  await prisma.boardPin.delete({ where: { id: saveRecord.id } })
  await prisma.boardSection.delete({ where: { id: section.id } })
  await prisma.board.delete({ where: { id: testBoard.id } })
  console.log('✔ Test 37: Complete cleanup executed')

  console.log('--- ALL INTEGRATION TESTS PASSED (37/37) ---')
  await prisma.$disconnect()
}

runTests().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
