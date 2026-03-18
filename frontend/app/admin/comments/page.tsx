'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Search, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Comment, deleteComment, getAdminComments } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AdminShell } from '@/components/admin/AdminShell';
import { getPostPath } from '@/lib/posts/post-url';

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [postFilter, setPostFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getAdminComments();
      setComments(Array.isArray(items) ? items : []);
    } catch {
      setError('댓글 조회에 실패했습니다.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      void loadComments();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleDelete = async (comment: Comment) => {
    if (comment.isDeleted) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      setDeletingId(comment.id);
      await deleteComment(String(comment.postId), comment.id);
      toast({ title: '삭제 완료', description: '댓글이 삭제되었습니다.' });
      await loadComments();
    } catch {
      toast({
        title: '삭제 실패',
        description: '댓글 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const postOptions = Array.from(
    comments
      .reduce((map, comment) => {
        map.set(String(comment.postId), {
          id: String(comment.postId),
          title: comment.postTitle?.trim() || `포스트 #${comment.postId}`,
        });
        return map;
      }, new Map<string, { id: string; title: string }>())
      .values(),
  ).sort((a, b) => a.title.localeCompare(b.title, 'ko'));

  const filteredComments = comments.filter((comment) => {
    const matchesPost =
      postFilter === 'all' ? true : String(comment.postId) === postFilter;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return matchesPost;
    }

    const matchesSearch = [
      comment.authorName,
      comment.content,
      comment.postTitle,
      String(comment.postId),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));

    return matchesPost && matchesSearch;
  });

  const activeCount = comments.filter((comment) => !comment.isDeleted).length;
  const deletedCount = comments.length - activeCount;

  return (
    <AdminShell
      active="comments"
      title="댓글 관리"
      description="전체 댓글을 조회하고 포스트별로 필터링하거나 삭제합니다"
      actions={
        <Button
          onClick={() => void loadComments()}
          disabled={loading}
          variant="outline"
          className="border-brand-blue-200"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          새로고침
        </Button>
      }
    >
      <Card className="surface-default shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-xl text-neutral-slate-800">
                댓글 목록
              </CardTitle>
              <CardDescription>
                전체 {comments.length}개, 활성 {activeCount}개, 삭제{' '}
                {deletedCount}개 중 {filteredComments.length}개 표시
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-slate-400" />
                <Input
                  placeholder="작성자, 내용, 포스트 검색..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={postFilter} onValueChange={setPostFilter}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="포스트 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 포스트</SelectItem>
                  {postOptions.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-brand-blue-600" />
              <div className="text-neutral-slate-500">
                댓글을 불러오는 중...
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : filteredComments.length === 0 ? (
            <div className="py-12 text-center text-neutral-slate-500">
              {comments.length === 0
                ? '등록된 댓글이 없습니다'
                : '조건에 맞는 댓글이 없습니다'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>포스트</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="min-w-[220px]">
                        <div className="font-semibold text-neutral-slate-800">
                          {comment.postTitle?.trim() ||
                            `포스트 #${comment.postId}`}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-slate-500">
                          <span>ID {comment.postId}</span>
                          <Badge variant="outline">
                            {comment.parentId ? '답글' : '댓글'}
                          </Badge>
                        </div>
                        <Link
                          href={getPostPath({
                            id: comment.postId,
                            slug: comment.postSlug,
                          })}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-blue-700 hover:text-brand-blue-800"
                          target="_blank"
                          rel="noreferrer"
                        >
                          포스트 보기
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-neutral-slate-800">
                          {comment.authorName}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-2 text-neutral-slate-700">
                          {comment.content}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-slate-600">
                        {new Date(comment.createdAt).toLocaleString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={comment.isDeleted ? 'secondary' : 'default'}
                        >
                          {comment.isDeleted ? '삭제됨' : '활성'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleDelete(comment)}
                          disabled={
                            comment.isDeleted || deletingId === comment.id
                          }
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          {deletingId === comment.id ? '삭제 중...' : '삭제'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
