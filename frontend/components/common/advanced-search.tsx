"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X, Clock, Hash, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useSearchHistory, SearchHistoryItem } from "@/hooks/use-search-history"

interface AdvancedSearchProps {
  onSearch: (query: string) => void;
  onTagSearch?: (tag: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdvancedSearch({ 
  onSearch, 
  onTagSearch, 
  placeholder = "검색어를 입력하세요...",
  className = "" 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const { 
    searchHistory, 
    addToHistory, 
    removeFromHistory, 
    clearHistory,
    getRecentKeywords,
    getRecentTags 
  } = useSearchHistory()

  // 검색 실행 (더 이상 사용하지 않음)
  const handleSearch = (searchQuery: string, type: 'keyword' | 'tag' = 'keyword', clearInput: boolean = true) => {
    const trimmedQuery = searchQuery.trim()
    
    console.log('검색 실행:', { searchQuery, trimmedQuery, type, clearInput })
    
    setIsSearching(true)
    
    // 빈 검색어인 경우에도 검색 실행 (전체 결과 표시)
    if (trimmedQuery) {
      console.log('검색 기록 추가:', trimmedQuery, type)
      addToHistory(trimmedQuery, type)
    }
    
    if (type === 'tag' && onTagSearch) {
      onTagSearch(trimmedQuery)
    } else {
      onSearch(trimmedQuery)
    }
    
    // 자동 검색이 아닌 경우에만 입력창 초기화
    if (clearInput) {
      setQuery("")
      setShowHistory(false)
    }
    
    // 검색 완료 후 로딩 상태 해제
    setTimeout(() => setIsSearching(false), 500)
  }

  // 실시간 필터링 처리
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    // 실시간으로 검색 실행 (딜레이 없이)
    const trimmedQuery = newQuery.trim()
    onSearch(trimmedQuery)
    
    // 타이머 클리어 (자동 저장 제거)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }

  // 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // 타이머 클리어
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      const trimmedQuery = query.trim()
      if (trimmedQuery) {
        addToHistory(trimmedQuery, 'keyword')
      }
      
      // 엔터키는 포커스만 빠지도록
      setShowHistory(false)
      inputRef.current?.blur()
    }
  }

  // 검색 기록 아이템 클릭
  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    console.log('검색 기록 클릭:', item)
    
    // 먼저 검색어를 입력창에 설정
    setQuery(item.query)
    
    // 그 다음 검색 실행
    if (item.type === 'tag' && onTagSearch) {
      onTagSearch(item.query)
    } else {
      onSearch(item.query)
    }
    
    // 드롭다운 유지 (숨기지 않음)
    // setShowHistory(false)
  }

  // 검색 기록 삭제
  const handleRemoveHistory = (e: React.MouseEvent, query: string) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('검색 기록 삭제:', query)
    removeFromHistory(query)
    // 드롭다운 유지 (숨기지 않음)
  }

  // 포커스 시 히스토리 표시
  const handleFocus = () => {
    console.log('포커스 이벤트:', { searchHistoryLength: searchHistory.length })
    if (searchHistory.length > 0) {
      console.log('드롭다운 표시')
      setShowHistory(true)
    } else {
      console.log('검색 기록이 없음')
    }
  }

  // 외부 클릭 시 히스토리 숨김
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('외부 클릭 이벤트:', event.target)
      
      // 드롭다운 내부 클릭인지 확인
      const target = event.target as Element
      const isDropdownClick = target.closest('.search-dropdown')
      
      if (inputRef.current && !inputRef.current.contains(event.target as Node) && !isDropdownClick) {
        console.log('드롭다운 숨김')
        setShowHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const recentKeywords = getRecentKeywords(3)
  const recentTags = getRecentTags(3)
  
  console.log('검색 기록 상태:', {
    searchHistory,
    recentKeywords,
    recentTags,
    showHistory,
    searchHistoryLength: searchHistory.length
  })

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleQueryChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setQuery("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 검색 기록 드롭다운 */}
      {showHistory && searchHistory.length > 0 && (
        console.log('드롭다운 렌더링:', { showHistory, searchHistoryLength: searchHistory.length }) || true
      ) && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-indigo-500 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto search-dropdown"
          onClick={() => console.log('드롭다운 컨테이너 클릭')}
        >
          <div className="p-3">
            {/* 최근 키워드 검색 */}
            {recentKeywords.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">최근 검색어</span>
                </div>
                <div className="space-y-1">
                  {recentKeywords.map((item) => (
                    <div
                      key={`${item.query}-${item.timestamp}`}
                      className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer relative"
                      onClick={() => {
                        console.log('키워드 아이템 클릭 이벤트 발생!')
                        console.log('키워드 아이템 클릭:', item)
                        handleHistoryItemClick(item)
                      }}
                      onMouseDown={() => console.log('키워드 아이템 마우스다운 이벤트')}
                      onMouseUp={() => console.log('키워드 아이템 마우스업 이벤트')}
                    >
                      <span className="text-sm text-gray-700">{item.query}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity z-10"
                        onClick={(e) => {
                          console.log('키워드 삭제 버튼 클릭 이벤트 발생!')
                          console.log('키워드 삭제 버튼 클릭:', item.query)
                          handleRemoveHistory(e, item.query)
                        }}
                        onMouseDown={(e) => {
                          console.log('키워드 삭제 버튼 마우스다운 이벤트')
                          e.stopPropagation()
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최근 태그 검색 */}
            {recentTags.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">최근 태그 검색</span>
                </div>
                <div className="space-y-1">
                  {recentTags.map((item) => (
                    <div
                      key={`${item.query}-${item.timestamp}`}
                      className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer relative"
                      onClick={() => {
                        console.log('태그 아이템 클릭:', item)
                        handleHistoryItemClick(item)
                      }}
                    >
                      <Badge variant="outline" className="text-xs">
                        {item.query}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity z-10"
                        onClick={(e) => {
                          console.log('태그 삭제 버튼 클릭:', item.query)
                          handleRemoveHistory(e, item.query)
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 검색 기록 전체 삭제 */}
            {searchHistory.length > 0 && (
              <div className="border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-gray-500 hover:text-red-500"
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