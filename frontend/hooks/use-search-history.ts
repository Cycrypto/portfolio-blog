import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'blog_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  type: 'keyword' | 'tag';
}

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // 로컬 스토리지에서 검색 기록 로드
  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    console.log('로드된 검색 기록:', savedHistory);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        console.log('파싱된 검색 기록:', parsed);
        setSearchHistory(parsed);
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // 검색 기록 저장
  const addToHistory = (query: string, type: 'keyword' | 'tag' = 'keyword') => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const newItem: SearchHistoryItem = {
      query: trimmedQuery,
      timestamp: Date.now(),
      type
    };

    setSearchHistory(prev => {
      // 중복 제거 (같은 쿼리가 있으면 제거)
      const filtered = prev.filter(item => item.query !== query.trim());
      
      // 새 아이템을 맨 앞에 추가
      const updated = [newItem, ...filtered];
      
      // 최대 개수 제한
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);
      
      // 로컬 스토리지에 저장
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
      
      return limited;
    });
  };

  // 검색 기록 삭제
  const removeFromHistory = (query: string) => {
    console.log('검색 기록 삭제 시도:', query);
    setSearchHistory(prev => {
      const updated = prev.filter(item => item.query !== query);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      console.log('검색 기록 삭제 완료:', updated);
      return updated;
    });
  };

  // 검색 기록 전체 삭제
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // 최근 검색어 가져오기 (키워드만)
  const getRecentKeywords = (limit: number = 5) => {
    return searchHistory
      .filter(item => item.type === 'keyword')
      .slice(0, limit);
  };

  // 최근 태그 검색 가져오기
  const getRecentTags = (limit: number = 5) => {
    return searchHistory
      .filter(item => item.type === 'tag')
      .slice(0, limit);
  };

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentKeywords,
    getRecentTags
  };
} 