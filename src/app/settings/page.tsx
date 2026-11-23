'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Toast, { ToastMessage } from '@/components/Toast'
import { SessionState } from '@/types'
import {
  User,
  Shield,
  Sliders,
  Loader2,
  Check,
  ChevronRight,
  Lock,
  Mail,
  AlertTriangle,
  Globe,
  Sparkles,
} from 'lucide-react'

const FEED_TOPICS = [
  { id: 'interior', name: 'Interior Design', icon: '🛋️' },
  { id: 'architecture', name: 'Architecture', icon: '🏛️' },
  { id: 'minimalism', name: 'Minimalism & Japandi', icon: '🎋' },
  { id: 'art', name: 'Contemporary Art', icon: '🎨' },
  { id: 'photography', name: 'Street Photography', icon: '📷' },
  { id: 'food', name: 'Culinary & Baking', icon: '🥐' },
  { id: 'diy', name: 'DIY & Woodworking', icon: '🔨' },
  { id: 'travel', name: 'Nordic Travel', icon: '✈️' },
  { id: 'tech', name: 'Creative Tech & Gear', icon: '💻' },
  { id: 'plants', name: 'Botanical Gardens', icon: '🌿' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'tune'>('profile')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Profile Form State
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [about, setAbout] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Account Form State
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  // Tune Feed State
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'interior',
    'architecture',
    'minimalism',
  ])
  const [enableHistoryRecommendations, setEnableHistoryRecommendations] = useState(true)

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/v1/session')
      const data = await res.json()
      setSession(data)
      if (!data.authenticated) {
        router.push('/')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadData = async () => {
    try {
      const [profRes, accRes] = await Promise.all([
        fetch('/api/v1/users/me/profile'),
        fetch('/api/v1/users/me/account'),
      ])

      if (profRes.ok) {
        const profData = await profRes.json()
        if (profData.profile) {
          setDisplayName(profData.profile.displayName || '')
          setUsername(profData.profile.username || '')
          setAbout(profData.profile.about || '')
          setWebsite(profData.profile.website || '')
          setAvatarUrl(profData.profile.avatarUrl || '')
        }
      }

      if (accRes.ok) {
        const accData = await accRes.json()
        if (accData.account) {
          setEmail(accData.account.email || '')
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSession()
    loadData()
  }, [])

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setToast({
        id: Date.now().toString(),
        title: 'Please select an image file (PNG, JPG, WEBP)',
        type: 'error',
      })
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload image')

      setAvatarUrl(data.url)
      setToast({
        id: Date.now().toString(),
        title: 'Profile photo updated! Save changes to apply.',
        type: 'success',
      })
    } catch (err: unknown) {
      setToast({
        id: Date.now().toString(),
        title: err instanceof Error ? err.message : 'Upload failed',
        type: 'error',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)

    try {
      const res = await fetch('/api/v1/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          username: username.trim(),
          about: about.trim() || null,
          website: website.trim() || null,
          avatarUrl: avatarUrl || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setToast({
        id: Date.now().toString(),
        title: 'Profile updated successfully',
        type: 'success',
      })
    } catch (err: unknown) {
      setToast({
        id: Date.now().toString(),
        title: err instanceof Error ? err.message : 'Error updating profile',
        type: 'error',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      setToast({
        id: Date.now().toString(),
        title: 'New passwords do not match',
        type: 'error',
      })
      return
    }

    setSavingAccount(true)
    try {
      const res = await fetch('/api/v1/users/me/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update account')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setToast({
        id: Date.now().toString(),
        title: 'Account settings saved successfully',
        type: 'success',
      })
    } catch (err: unknown) {
      setToast({
        id: Date.now().toString(),
        title: err instanceof Error ? err.message : 'Error updating account',
        type: 'error',
      })
    } finally {
      setSavingAccount(false)
    }
  }

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
    setToast({
      id: Date.now().toString(),
      title: 'Home feed recommendations updated',
      type: 'info',
    })
  }

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings Left Navigation Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <h2 className="text-xl font-black tracking-tight mb-4 px-3 text-[#111111]">Settings</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-[#e9e9e9] text-[#111111]'
                    : 'text-[#767676] hover:bg-[#f0f0f0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-[#767676]" />
                  <span>Public profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#767676]" />
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                  activeTab === 'account'
                    ? 'bg-[#e9e9e9] text-[#111111]'
                    : 'text-[#767676] hover:bg-[#f0f0f0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#767676]" />
                  <span>Account management</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#767676]" />
              </button>

              <button
                onClick={() => setActiveTab('tune')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                  activeTab === 'tune'
                    ? 'bg-[#e9e9e9] text-[#111111]'
                    : 'text-[#767676] hover:bg-[#f0f0f0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-4 h-4 text-[#767676]" />
                  <span>Tune your home feed</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#767676]" />
              </button>
            </nav>
          </aside>

          {/* Settings Tab Content Area */}
          <main className="flex-1 max-w-2xl">
            {/* Tab 1: Public Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-2xl font-black text-[#111111]">
                    Public profile
                  </h1>
                  <p className="text-xs text-[#767676] mt-1">
                    People visiting your profile will see the following information.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-2">
                      Photo
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#e9e9e9] border border-zinc-200">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#767676]">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleAvatarFile(file)
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111] font-bold text-xs rounded-full transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-white border border-[#cdcdcd] rounded-2xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                    />
                  </div>

                  {/* About / Bio */}
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      About
                    </label>
                    <textarea
                      rows={3}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      placeholder="Tell your story..."
                      className="w-full px-4 py-3 bg-white border border-[#cdcdcd] rounded-2xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors resize-none"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-[#767676] absolute left-4 top-3.5" />
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#cdcdcd] rounded-2xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <span className="text-[#767676] text-xs absolute left-4 top-3.5">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-white border border-[#cdcdcd] rounded-2xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-[#767676] mt-1">
                      www.s-store.com/{username || 'username'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-2.5 bg-[#e60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save profile</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Account Management */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-2xl font-black text-[#111111]">
                    Account management
                  </h1>
                  <p className="text-xs text-[#767676] mt-1">
                    Manage your email address, login credentials, and account settings.
                  </p>
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-6">
                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#767676] absolute left-4 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#cdcdcd] rounded-2xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Change Password Card */}
                  <div className="p-5 bg-[#f9f9f9] border border-zinc-200 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#767676]" />
                      <h3 className="text-xs font-bold text-[#111111]">
                        Change password
                      </h3>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#767676] mb-1">
                        Current password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-4 py-2.5 bg-white border border-[#cdcdcd] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#767676] mb-1">
                          New password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-4 py-2.5 bg-white border border-[#cdcdcd] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#767676] mb-1">
                          Confirm new password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full px-4 py-2.5 bg-white border border-[#cdcdcd] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingAccount}
                      className="px-6 py-2.5 bg-[#e60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {savingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save account changes</span>
                    </button>
                  </div>
                </form>

                {/* Deactivate / Delete Account Warning Box */}
                <div className="p-5 bg-red-50/50 border border-red-200 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2 text-[#e60023]">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="text-xs font-bold">Delete your data and account</h4>
                  </div>
                  <p className="text-[11px] text-[#767676]">
                    Deleting your account means you will permanently lose your saved pins, boards, and followers.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your S-Store account? This action cannot be undone.')) {
                        alert('Account deletion request acknowledged.')
                      }
                    }}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-[#e60023] font-bold text-xs rounded-full transition-colors"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Tune Your Home Feed */}
            {activeTab === 'tune' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-2xl font-black text-[#111111] flex items-center gap-2">
                    <span>Tune your home feed</span>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </h1>
                  <p className="text-xs text-[#767676] mt-1">
                    Select interests and topics to personalize what appears in your home feed stream.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#767676]">
                    Your Active Topics ({selectedTopics.length})
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {FEED_TOPICS.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.id)
                      return (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopic(topic.id)}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                              : 'bg-[#f9f9f9] border-zinc-200 hover:bg-[#e9e9e9] text-[#111111]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">{topic.icon}</span>
                            <span className="text-xs font-bold truncate">{topic.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-5 bg-[#f9f9f9] border border-zinc-200 rounded-3xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#111111]">
                      Activity-based suggestions
                    </h4>
                    <p className="text-[11px] text-[#767676]">
                      Use recently saved ideas and searches to improve your home feed pins.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableHistoryRecommendations}
                    onChange={(e) => {
                      setEnableHistoryRecommendations(e.target.checked)
                      setToast({
                        id: Date.now().toString(),
                        title: 'Preference saved',
                        type: 'info',
                      })
                    }}
                    className="w-4 h-4 rounded text-pinterest-red focus:ring-pinterest-red"
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
