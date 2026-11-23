export interface Creator {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

export interface BoardSummary {
  id: string
  title: string
}

export interface PinItem {
  id: string
  title: string
  description: string | null
  imageUrl: string
  videoUrl?: string | null
  mediaType?: 'image' | 'video' | 'carousel'
  mediaUrls?: string[]
  imageWidth: number
  imageHeight: number
  sourceLink: string | null
  category?: string
  position?: number
  sectionId?: string | null
  creator: Creator
  isSaved: boolean
  savedToBoards?: BoardSummary[]
  savedAt?: string | Date
  viewCount?: number
  clickCount?: number
  saveCount?: number
  createdAt?: string

  // Rich Pins metadata
  pinType?: 'standard' | 'product' | 'recipe' | 'article'
  price?: number | null
  currency?: string | null
  availability?: 'in_stock' | 'out_of_stock' | null
  brand?: string | null
  ingredients?: string[]
  cookTime?: number | null
  servings?: number | null
  rating?: number | null
  reviewCount?: number | null
}

export interface BoardSectionData {
  id: string
  title: string
  pinCount: number
  createdAt: string
}

export interface BoardSectionItem {
  id: string
  title: string
  boardId: string
  pinCount: number
  hasPin: boolean
}

export interface UserBoard {
  id: string
  title: string
  description: string | null
  isPrivate: boolean
  isArchived?: boolean
  pinCount: number
  coverThumbnail: string | null
  hasPin: boolean
  sections?: BoardSectionItem[]
}

export interface DirectMessage {
  id: string
  conversationId: string
  senderId: string
  text: string
  sharedPinId?: string | null
  createdAt: string
  sender: Creator
  sharedPin?: {
    id: string
    title: string
    imageUrl: string
  } | null
}

export interface ConversationSummary {
  id: string
  updatedAt: string
  otherUser: Creator | null
  participants: Creator[]
  lastMessage: DirectMessage | null
  hasUnread: boolean
}

export interface SessionState {
  authenticated: boolean
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    email: string
  } | null
}

export interface AnalyticsData {
  impressions: number
  saves: number
  clicks: number
  engagementRate: number
  dailyStats: {
    date: string
    impressions: number
    saves: number
    clicks: number
  }[]
  topPins: PinItem[]
}

