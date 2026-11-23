'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import LeftNavRail from './LeftNavRail'
import TopHeader from './TopHeader'
import NotificationsPopover from './NotificationsPopover'
import MessagesDrawer from './MessagesDrawer'
import CreatePinModal from './CreatePinModal'
import AuthModal from './AuthModal'
import Toast, { ToastMessage } from './Toast'
import VisualSearchModal from './VisualSearchModal'
import { SessionState, PinItem } from '@/types'

interface AppShellContextType {
  session: SessionState
  fetchSession: () => Promise<void>
  openAuthModal: (mode?: 'login' | 'signup') => void
  openCreatePinModal: () => void
  openVisualSearch: (pin?: PinItem | null) => void
  showToast: (msg: { title: string; type?: 'success' | 'error' | 'info' }) => void
}

const AppShellContext = createContext<AppShellContextType>({
  session: { authenticated: false, user: null },
  fetchSession: async () => {},
  openAuthModal: () => {},
  openCreatePinModal: () => {},
  openVisualSearch: () => {},
  showToast: () => {},
})

export const useAppShell = () => useContext(AppShellContext)

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  // Modals & Panels
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
  const [isCreatePinOpen, setIsCreatePinOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')
  const [visualSearchPin, setVisualSearchPin] = useState<PinItem | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const showToast = useCallback((msg: { title: string; type?: 'success' | 'error' | 'info' }) => {
    setToast({
      id: Date.now().toString(),
      title: msg.title,
      type: msg.type || 'info',
    })
  }, [])

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/session')
      const data = await res.json()
      setSession(data)
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }, [])

  const fetchUnreadCounts = useCallback(async () => {
    if (!session.authenticated) return
    try {
      const notifRes = await fetch('/api/v1/notifications')
      const notifData = await notifRes.json()
      setUnreadNotificationsCount(notifData.unreadCount || 0)
    } catch {}
  }, [session.authenticated])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (!session.authenticated) return
    fetchUnreadCounts()

    // Smooth background polling every 25s without pegging the event loop
    const interval = setInterval(fetchUnreadCounts, 25000)
    return () => clearInterval(interval)
  }, [session.authenticated, fetchUnreadCounts])

  const handleSwitchUser = async (username: string) => {
    await fetch('/api/v1/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    await fetchSession()
    showToast({
      title: username === 'guest' ? 'Logged out' : `Switched to @${username}`,
      type: 'info',
    })
  }

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }

  const openCreatePinModal = () => {
    if (!session.authenticated) {
      openAuthModal('login')
      return
    }
    setIsCreatePinOpen(true)
  }

  const openVisualSearch = (pin?: PinItem | null) => {
    if (pin) {
      setVisualSearchPin(pin)
    } else {
      // Default sample pin if none selected
      setVisualSearchPin({
        id: 'sample',
        title: 'Visual Discovery',
        description: null,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        imageWidth: 800,
        imageHeight: 1000,
        sourceLink: null,
        creator: { id: 'c', username: 's-store', displayName: 'S-Store', avatarUrl: null },
        isSaved: false,
      })
    }
  }

  return (
    <AppShellContext.Provider
      value={{
        session,
        fetchSession,
        openAuthModal,
        openCreatePinModal,
        openVisualSearch,
        showToast,
      }}
    >
      <div className="min-h-screen bg-white text-[#111111]">
        {/* Exact 72px Left Navigation Rail */}
        <LeftNavRail
          unreadCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
          onCreateClick={openCreatePinModal}
          onNotificationsClick={() => setIsNotificationsOpen((v) => !v)}
          onMessagesClick={() => setIsMessagesOpen((v) => !v)}
        />

        {/* Clean Sticky Top Search Header */}
        <TopHeader
          session={session}
          onSwitchUser={handleSwitchUser}
          onOpenAuthModal={openAuthModal}
          onOpenVisualSearch={() => openVisualSearch(null)}
        />

        {/* Notifications Popover positioned next to Left Rail */}
        <NotificationsPopover
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onUpdateUnreadCount={(cnt) => setUnreadNotificationsCount(cnt)}
        />

        {/* Direct Messages Drawer */}
        <MessagesDrawer
          isOpen={isMessagesOpen}
          onClose={() => setIsMessagesOpen(false)}
          session={session}
        />

        {/* Create Pin Studio Modal */}
        <CreatePinModal
          isOpen={isCreatePinOpen}
          onClose={() => setIsCreatePinOpen(false)}
          onPinCreated={(pin) => {
            showToast({ title: `Pin "${pin.title}" created successfully!`, type: 'success' })
          }}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={() => fetchSession()}
          onSwitchUser={handleSwitchUser}
        />

        {/* Visual Search Modal */}
        {visualSearchPin && (
          <VisualSearchModal
            pin={visualSearchPin}
            isOpen={Boolean(visualSearchPin)}
            onClose={() => setVisualSearchPin(null)}
            onOpenDetail={(p) => {
              window.location.href = `/pin/${p.id}`
            }}
            onQuickSave={async () => {}}
            onSaveToSpecificBoard={async () => {}}
            onCreateBoardClick={() => {}}
          />
        )}

        {/* Toast Alerts */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Main Workspace: Left padded for 72px rail, top padded for 64px header */}
        <main className="pl-[72px] pt-16 min-h-screen bg-white">
          {children}
        </main>
      </div>
    </AppShellContext.Provider>
  )
}
