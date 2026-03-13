'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

import { viewPost } from '@/lib/api';

const VIEWED_POSTS_STORAGE_KEY = 'blog-viewed-posts';

function readViewedPosts(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.sessionStorage.getItem(VIEWED_POSTS_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

function persistViewedPost(postId: string) {
  const viewedPosts = readViewedPosts();
  if (viewedPosts.includes(postId)) {
    return;
  }

  window.sessionStorage.setItem(
    VIEWED_POSTS_STORAGE_KEY,
    JSON.stringify([...viewedPosts, postId]),
  );
}

function removeViewedPost(postId: string) {
  const viewedPosts = readViewedPosts();
  if (!viewedPosts.includes(postId)) {
    return;
  }

  window.sessionStorage.setItem(
    VIEWED_POSTS_STORAGE_KEY,
    JSON.stringify(
      viewedPosts.filter((currentPostId) => currentPostId !== postId),
    ),
  );
}

interface PostViewCountProps {
  postId: string;
  initialViews: number;
}

export function PostViewCount({ postId, initialViews }: PostViewCountProps) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    let isCancelled = false;

    setViews(initialViews);

    if (readViewedPosts().includes(postId)) {
      return;
    }

    persistViewedPost(postId);

    const trackView = async () => {
      try {
        const result = await viewPost(postId);
        if (isCancelled) {
          return;
        }

        setViews(result.views);
      } catch (error) {
        removeViewedPost(postId);
        console.error('Failed to track post view:', error);
      }
    };

    void trackView();

    return () => {
      isCancelled = true;
    };
  }, [initialViews, postId]);

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4" />
      <span>{views.toLocaleString()} 조회</span>
    </div>
  );
}
