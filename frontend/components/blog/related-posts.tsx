'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getPosts, Post } from '@/lib/api';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { getPostPath } from '@/lib/posts/post-url';

interface RelatedPostsProps {
  currentPostId: number;
  currentPostSlug?: string;
}

export function RelatedPosts({
  currentPostId,
  currentPostSlug,
}: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        setLoading(true);
        const { posts: allPosts } = await getPosts(1, 24);
        const currentPost = allPosts.find(
          (post) =>
            post.id === currentPostId ||
            (currentPostSlug && post.slug === currentPostSlug),
        );
        const currentTags = new Set(currentPost?.tags || []);

        const nextPosts = allPosts
          .filter(
            (post) =>
              post.id !== currentPostId &&
              (!currentPostSlug || post.slug !== currentPostSlug),
          )
          .map((post) => {
            const sharedTagCount = (post.tags || []).filter((tag) =>
              currentTags.has(tag),
            ).length;

            return { post, sharedTagCount };
          })
          .sort((a, b) => {
            if (b.sharedTagCount !== a.sharedTagCount) {
              return b.sharedTagCount - a.sharedTagCount;
            }

            return (
              new Date(b.post.publishDate).getTime() -
              new Date(a.post.publishDate).getTime()
            );
          })
          .slice(0, 3)
          .map(({ post }) => post);

        setRelatedPosts(nextPosts);
      } catch (error) {
        console.error('Failed to fetch related posts:', error);
        setRelatedPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedPosts();
  }, [currentPostId, currentPostSlug]);

  if (loading) {
    return (
      <Panel variant="glass" className="relative overflow-hidden p-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">
            함께 읽으면 좋은 글
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-neutral-slate-200 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    );
  }

  if (relatedPosts.length === 0) {
    return (
      <Panel variant="glass" className="relative overflow-hidden p-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">
            함께 읽으면 좋은 글
          </h3>
          <p className="text-neutral-slate-500 text-sm">
            이 글과 함께 볼 글을 준비 중입니다.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel variant="glass" className="relative overflow-hidden p-6">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>

      <div className="relative">
        <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">
          함께 읽으면 좋은 글
        </h3>
        <div className="space-y-4">
          {relatedPosts.map((post) => (
            <Link
              key={post.id}
              href={getPostPath(post)}
              className="block group"
            >
              <div className="p-3 rounded-lg border border-neutral-slate-200 hover:border-brand-blue-200 transition-colors">
                <h4 className="font-medium text-neutral-slate-800 group-hover:text-brand-blue-600 transition-colors mb-1 line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-sm text-neutral-slate-500">
                  읽는 데 {post.readTime}분
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Button variant="brand-ghost" className="mt-4 w-full" asChild>
          <Link href="/blog">
            글 목록 보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Panel>
  );
}
