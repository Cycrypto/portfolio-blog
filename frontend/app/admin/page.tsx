'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Calendar,
  Eye,
  FileText,
  FolderOpen,
  MessageSquare,
  PlusCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStats, StatsData } from '@/lib/api';
import { Post, Project } from '@/lib/types/api';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch {
        setError('통계를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const recentPosts: Post[] = stats?.recentPosts || [];
  const recentProjects: Project[] = stats?.recentProjects || [];

  const statCards = [
    {
      title: '총 블로그 포스트',
      value: stats?.totals.posts ?? '-',
      description: '게시/임시/예약 포함',
      icon: FileText,
      link: '/admin/posts',
    },
    {
      title: '총 프로젝트',
      value: stats?.totals.projects ?? '-',
      description: '전체 프로젝트 수',
      icon: FolderOpen,
      link: '/admin/projects',
    },
    {
      title: '총 조회수',
      value: stats?.totals.views?.toLocaleString() ?? '-',
      description: '전체 포스트 누적 조회수',
      icon: Eye,
      link: '/admin/posts',
    },
    {
      title: '총 댓글',
      value: stats?.totals.comments ?? '-',
      description: '삭제 제외',
      icon: MessageSquare,
      link: '/admin/comments',
    },
  ];

  return (
    <AdminShell
      active="dashboard"
      title="대시보드"
      description="사이트 운영 상태를 한눈에 확인하세요"
      actions={
        <div className="flex items-center gap-2 rounded-md border border-brand-blue-100 bg-white px-3 py-1.5 text-xs text-neutral-slate-600 md:text-sm">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            href={stat.link}
            key={stat.title}
            className="surface-elevated block p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-slate-600">
                  {stat.title}
                </div>
                <div className="mt-2 text-3xl font-black text-neutral-slate-800">
                  {stat.value}
                </div>
                <p className="mt-1 text-xs text-neutral-slate-500">
                  {stat.description}
                </p>
              </div>
              <div className="rounded-lg bg-brand-blue-50 p-2">
                <stat.icon className="h-4 w-4 text-brand-blue-700" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl text-neutral-slate-800">
                  최근 블로그 포스트
                </CardTitle>
                <CardDescription>최근에 작성된 포스트</CardDescription>
              </div>
              <Button
                asChild
                size="sm"
                className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
              >
                <Link href="/admin/posts/new">
                  <PlusCircle className="mr-2 h-4 w-4" />새 포스트
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg bg-neutral-slate-100"
                  />
                ))}
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="py-10 text-center text-neutral-slate-500">
                아직 작성된 포스트가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    key={post.id}
                    className="block rounded-lg border border-brand-blue-100 p-4 transition-colors hover:bg-brand-blue-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-semibold text-neutral-slate-800">
                          {post.title}
                        </h4>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant={
                              post.status === 'published'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {post.status === 'published'
                              ? '게시됨'
                              : '임시저장'}
                          </Badge>
                          <span className="text-xs text-neutral-slate-500">
                            {post.publishDate}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-full bg-neutral-slate-100 px-3 py-1 text-xs text-neutral-slate-600">
                        조회 {post.views}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="mt-5 w-full border-brand-blue-200 text-brand-blue-700"
              asChild
            >
              <Link href="/admin/posts">
                모든 포스트 보기
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl text-neutral-slate-800">
                  최근 프로젝트
                </CardTitle>
                <CardDescription>최근 등록된 프로젝트</CardDescription>
              </div>
              <Button
                asChild
                size="sm"
                className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
              >
                <Link href="/admin/projects/new">
                  <PlusCircle className="mr-2 h-4 w-4" />새 프로젝트
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-lg bg-neutral-slate-100"
                  />
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="py-10 text-center text-neutral-slate-500">
                아직 등록된 프로젝트가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    key={project.id}
                    className="block rounded-lg border border-brand-blue-100 p-4 transition-colors hover:bg-brand-blue-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="truncate font-semibold text-neutral-slate-800">
                        {project.title}
                      </h4>
                      <Badge variant="outline">
                        {project.status || '미정'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(project.techStack || []).slice(0, 4).map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="mt-5 w-full border-brand-blue-200 text-brand-blue-700"
              asChild
            >
              <Link href="/admin/projects">
                모든 프로젝트 보기
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
