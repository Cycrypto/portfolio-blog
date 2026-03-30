'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getTopTags, Tag } from '@/lib/api';
import { useSearchHistory } from '@/hooks/use-search-history';

interface BlogFilterProps {
  onTagSelect?: (tag: string) => void;
}

export function BlogFilter({ onTagSelect }: BlogFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { addToHistory } = useSearchHistory();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const topTags = await getTopTags(5);
        setTags(topTags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleTagClick = (tagName: string) => {
    const newSelectedTag = selectedTag === tagName ? '' : tagName;
    setSelectedTag(newSelectedTag);

    if (newSelectedTag) {
      addToHistory(newSelectedTag, 'tag');
    }

    onTagSelect?.(newSelectedTag);
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedTag === '' ? 'brand' : 'brand-outline'}
        size="sm"
        onClick={() => handleTagClick('')}
      >
        전체
      </Button>
      {tags
        .filter((tag) => tag.usageCount > 0)
        .map((tag) => (
          <Button
            key={tag.id}
            variant={selectedTag === tag.name ? 'brand' : 'brand-outline'}
            size="sm"
            onClick={() => handleTagClick(tag.name)}
          >
            {tag.name}
            <span className="ml-1 text-xs opacity-70">({tag.usageCount})</span>
          </Button>
        ))}
    </div>
  );
}
