'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnalyticsData, PinItem } from '@/types'
import { TrendingUp, Eye, Bookmark, MousePointerClick, BarChart3, ArrowUpRight, Calendar, Sparkles } from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<'impressions' | 'saves' | 'clicks'>('impressions')
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('30')

  useEffect(() => {
    fetch('/api/v1/analytics')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then((json) => {
        if (json.analytics) {
          setData(json.analytics)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="h-8 w-60 bg-zinc-200 rounded-md mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-zinc-100 rounded-3xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full text-center py-24">
        <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#111111]">Analytics Unavailable</h2>
        <p className="text-sm text-[#767676] mt-1">Please log in to view creator analytics.</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111] font-bold text-xs rounded-full transition-colors"
          >
            Return Home
          </Link>
          <button
            onClick={() => {
              const loginBtn = document.querySelector('header button') as HTMLButtonElement | null
              if (loginBtn) loginBtn.click()
              else window.location.href = '/'
            }}
            className="px-5 py-2.5 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-xs rounded-full transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    )
  }

  // Filter daily points according to range
  const daysCount = Number(timeRange)
  const chartPoints = data.dailyStats.slice(-daysCount)
  const maxVal = Math.max(...chartPoints.map((p) => p[activeMetric]), 10)

  // Generate SVG path points
  const svgWidth = 800
  const svgHeight = 240
  const pointsString = chartPoints
    .map((p, idx) => {
      const x = (idx / (chartPoints.length - 1)) * svgWidth
      const y = svgHeight - (p[activeMetric] / maxVal) * (svgHeight - 40) - 20
      return `${x},${y}`
    })
    .join(' ')

  const metricColors = {
    impressions: { stroke: '#4f46e5', fill: 'rgba(79, 70, 229, 0.1)', text: 'text-indigo-600' },
    saves: { stroke: '#e60023', fill: 'rgba(230, 0, 35, 0.1)', text: 'text-[#e60023]' },
    clicks: { stroke: '#059669', fill: 'rgba(5, 150, 105, 0.1)', text: 'text-emerald-600' },
  }

  return (
    <div className="w-full min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-100 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Analytics Studio
            </h1>
            <p className="text-xs text-[#767676] mt-1">
              Performance metrics and organic growth across all your published Pins
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#767676]">Range:</span>
            <div className="inline-flex p-1 bg-[#e9e9e9] rounded-full text-xs font-bold">
              {(['7', '14', '30'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    timeRange === r ? 'bg-white text-[#111111] shadow-xs' : 'text-[#767676] hover:text-[#111111]'
                  }`}
                >
                  {r} days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
          <button
            onClick={() => setActiveMetric('impressions')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeMetric === 'impressions'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-600/20'
                : 'border-zinc-200/80 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#767676]">Impressions</span>
              <Eye className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#111111]">
              {data.impressions.toLocaleString()}
            </p>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">
              ↑ 12.4% vs last period
            </span>
          </button>

          <button
            onClick={() => setActiveMetric('saves')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeMetric === 'saves'
                ? 'border-[#e60023] bg-red-50/40 shadow-sm ring-2 ring-red-600/20'
                : 'border-zinc-200/80 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#767676]">Saves</span>
              <Bookmark className="w-4 h-4 text-[#e60023]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#111111]">
              {data.saves.toLocaleString()}
            </p>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">
              ↑ 8.1% vs last period
            </span>
          </button>

          <button
            onClick={() => setActiveMetric('clicks')}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeMetric === 'clicks'
                ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-600/20'
                : 'border-zinc-200/80 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#767676]">Pin Clicks</span>
              <MousePointerClick className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#111111]">
              {data.clicks.toLocaleString()}
            </p>
            <span className="text-[11px] font-bold text-emerald-600 mt-1 inline-block">
              ↑ 15.7% vs last period
            </span>
          </button>

          <div className="p-5 rounded-2xl border border-zinc-200/80 bg-white text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#767676]">Engagement Rate</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#111111]">
              {data.engagementRate}%
            </p>
            <span className="text-[11px] font-medium text-[#767676] mt-1 inline-block">
              Saves & clicks / impressions
            </span>
          </div>
        </div>

        {/* Time-Series Graph */}
        <div className="p-6 bg-white rounded-3xl border border-zinc-200/80 shadow-xs mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-[#111111] capitalize">
              {activeMetric} trend ({timeRange} days)
            </h2>
            <span className="text-xs text-[#767676] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Daily totals
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 sm:h-64 overflow-visible"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = svgHeight - pct * (svgHeight - 40) - 20
                return (
                  <g key={idx}>
                    <line
                      x1="0"
                      y1={y}
                      x2={svgWidth}
                      y2={y}
                      stroke="#f4f4f5"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y={y - 4}
                      fill="#a1a1aa"
                      fontSize="10"
                      className="font-medium"
                    >
                      {Math.round(maxVal * pct)}
                    </text>
                  </g>
                )
              })}

              {/* Area under curve */}
              <polygon
                points={`0,${svgHeight} ${pointsString} ${svgWidth},${svgHeight}`}
                fill={metricColors[activeMetric].fill}
              />

              {/* Metric Line */}
              <polyline
                points={pointsString}
                fill="none"
                stroke={metricColors[activeMetric].stroke}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {chartPoints.map((p, idx) => {
                const x = (idx / (chartPoints.length - 1)) * svgWidth
                const y = svgHeight - (p[activeMetric] / maxVal) * (svgHeight - 40) - 20
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="white"
                    stroke={metricColors[activeMetric].stroke}
                    strokeWidth="2"
                    className="transition-transform hover:scale-150"
                  />
                )
              })}
            </svg>
          </div>
        </div>

        {/* Top Pins Performance Leaderboard */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#111111]">Top Performing Pins</h2>
              <p className="text-xs text-[#767676]">Your best content ranked by total views & saves</p>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-[#e60023] hover:underline"
            >
              Create more pins
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {data.topPins.map((pin, idx) => (
              <div
                key={pin.id}
                onClick={() => router.push(`/pin/${pin.id}`)}
                className="py-3.5 flex items-center justify-between hover:bg-zinc-50/80 -mx-3 px-3 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-[#767676] w-4 text-center">
                    {idx + 1}
                  </span>
                  <img
                    src={pin.imageUrl}
                    alt={pin.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#111111] truncate max-w-xs sm:max-w-md">
                      {pin.title}
                    </h4>
                    <p className="text-[11px] text-[#767676] mt-0.5">
                      {pin.mediaType === 'video' ? 'Video Pin' : pin.pinType === 'product' ? 'Product Pin' : 'Standard Pin'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-10 shrink-0 text-right">
                  <div>
                    <p className="text-xs font-bold text-[#111111]">
                      {pin.viewCount ?? 0}
                    </p>
                    <p className="text-[10px] text-[#767676]">Views</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#111111]">
                      {pin.saveCount ?? 0}
                    </p>
                    <p className="text-[10px] text-[#767676]">Saves</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#111111]">
                      {pin.clickCount ?? 0}
                    </p>
                    <p className="text-[10px] text-[#767676]">Clicks</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
