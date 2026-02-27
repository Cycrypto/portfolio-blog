"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react"
import { Clock, Hash, Search, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchHistoryItem, useSearchHistory } from "@/hooks/use-search-history"

interface AdvancedSearchProps {
  onSearch: (query: string) => void
  onTagSearch?: (tag: string) => void
  placeholder?: string
  className?: string
}

const SEARCH_DEBOUNCE_MS = 200

export function AdvancedSearch({
  onSearch,
  onTagSearch,
  placeholder = "검색어를 입력하세요...",
  className = "",
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { searchHistory, addToHistory, removeFromHistory, clearHistory, getRecentKeywords, getRecentTags } = useSearchHistory()

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch(query.trim())
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, onSearch])

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowHistory(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    setQuery(item.query)

    if (item.type === "tag" && onTagSearch) {
      onTagSearch(item.query)
    } else {
      onSearch(item.query)
    }

    addToHistory(item.query, item.type)
    setShowHistory(false)
    inputRef.current?.blur()
  }

  const handleRemoveHistory = (e: ReactMouseEvent, historyQuery: string) => {
    e.stopPropagation()
    removeFromHistory(historyQuery)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") {
      return
    }

    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      addToHistory(trimmedQuery, "keyword")
      onSearch(trimmedQuery)
    }

    setShowHistory(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setQuery("")
    onSearch("")
    setShowHistory(false)
  }

  const recentKeywords = getRecentKeywords(3)
  const recentTags = getRecentTags(3)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-slate-500" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowHistory(searchHistory.length > 0)}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-indigo-500 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-3">
            {recentKeywords.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-neutral-slate-500" />
                  <span className="text-sm font-medium text-neutral-slate-700">최근 검색어</span>
                </div>
                <div className="space-y-1">
                  {recentKeywords.map((item) => (
                    <div
                      key={`${item.query}-${item.timestamp}`}
                      className="group flex items-center justify-between p-2 hover:bg-neutral-gray-50 rounded cursor-pointer relative"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <span className="text-sm text-neutral-slate-700">{item.query}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity z-10"
                        onClick={(e) => handleRemoveHistory(e, item.query)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentTags.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-neutral-slate-500" />
                  <span className="text-sm font-medium text-neutral-slate-700">최근 태그 검색</span>
                </div>
                <div className="space-y-1">
                  {recentTags.map((item) => (
                    <div
                      key={`${item.query}-${item.timestamp}`}
                      className="group flex items-center justify-between p-2 hover:bg-neutral-gray-50 rounded cursor-pointer relative"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <Badge variant="outline" className="text-xs">
                        {item.query}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity z-10"
                        onClick={(e) => handleRemoveHistory(e, item.query)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchHistory.length > 0 && (
              <div className="border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-neutral-slate-500 hover:text-destructive"
                  onClick={clearHistory}
                >
                  검색 기록 전체 삭제
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
