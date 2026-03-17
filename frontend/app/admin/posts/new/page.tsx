'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JSONContent } from '@tiptap/react';
import { Save, Settings2 } from 'lucide-react';

import { PostEditorLayout } from '@/components/admin/post-editor/PostEditorLayout';
import { PostSettingsDialog } from '@/components/admin/post-editor/PostSettingsDialog';
import { Button } from '@/components/ui/button';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { createPost, uploadMedia } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/utils/image';
import { calculateEditorMetrics } from '@/lib/posts/editor-metrics';
import { DEFAULT_POST_CATEGORY } from '@/lib/posts/post-editor-config';
import { getPostPath } from '@/lib/posts/post-url';
import { CreatePostRequest } from '@/lib/types/api';

const EMPTY_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};
const DRAFT_STORAGE_KEY = 'blog:new-post-draft-v2';
const DEFAULT_AUTHOR = '박준하';

type SaveStatus = 'draft' | 'published';

interface StoredDraft {
  title: string;
  contentJson: JSONContent;
  category: string;
  tags: string[];
  featuredImage: string;
  isFeatured: boolean;
  featuredOrder: number;
  updatedAt: string;
}

const getActionLabel = (status: SaveStatus, isSaving: boolean) => {
  if (!isSaving) {
    return status === 'draft' ? '임시저장' : '게시하기';
  }

  return status === 'draft' ? '저장 중...' : '게시 중...';
};

export default function NewPost() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [contentJson, setContentJson] = useState<JSONContent>(EMPTY_CONTENT);
  const [category, setCategory] = useState(DEFAULT_POST_CATEGORY);
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFeaturedImage, setIsUploadingFeaturedImage] =
    useState(false);
  const [isUploadingEditorMedia, setIsUploadingEditorMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);

  const metrics = useMemo(
    () => calculateEditorMetrics(contentJson),
    [contentJson],
  );
  const normalizedFeaturedImage = useMemo(
    () => normalizeImageUrl(featuredImage),
    [featuredImage],
  );
  const isUploadingMedia = isUploadingFeaturedImage || isUploadingEditorMedia;

  const hasUnsavedChanges =
    title.trim().length > 0 ||
    metrics.characterCount > 0 ||
    category !== DEFAULT_POST_CATEGORY ||
    tags.length > 0 ||
    isFeatured ||
    featuredOrder > 0 ||
    !!normalizedFeaturedImage;

  const handleExit = () => {
    if (
      hasUnsavedChanges &&
      !confirm('저장되지 않은 변경사항이 있습니다. 나가시겠습니까?')
    ) {
      return;
    }
    router.push('/admin/posts');
  };

  const handleFeaturedImageUpload = useCallback(async (file: File) => {
    try {
      setIsUploadingFeaturedImage(true);
      setError(null);
      const url = await uploadMedia(file);
      setFeaturedImage(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.',
      );
    } finally {
      setIsUploadingFeaturedImage(false);
    }
  }, []);

  const handleSave = useCallback(
    async (saveStatus: SaveStatus) => {
      if (!title.trim()) {
        setError('제목을 입력해주세요.');
        return;
      }

      if (!category.trim()) {
        setError('카테고리를 선택해주세요.');
        return;
      }

      if (isUploadingMedia) {
        setError('이미지 업로드가 끝난 뒤 다시 시도해주세요.');
        return;
      }

      try {
        setIsSaving(true);
        setError(null);

        const postData: CreatePostRequest = {
          title: title.trim(),
          contentType: 'tiptap',
          contentJson,
          image: normalizedFeaturedImage,
          isFeatured,
          featuredOrder: isFeatured ? featuredOrder : 0,
          tags: tags.length > 0 ? tags : undefined,
          status: saveStatus,
          author: DEFAULT_AUTHOR,
          category,
          publishDate: new Date().toISOString(),
          readTime: metrics.estimatedReadTime,
        };

        const createdPost = await createPost(postData);
        localStorage.removeItem(DRAFT_STORAGE_KEY);

        if (saveStatus === 'draft') {
          router.push(`/admin/posts/${createdPost.id}/edit`);
          return;
        }

        router.push(getPostPath(createdPost));
      } catch (err) {
        console.error('Error creating post:', err);
        setError(
          `게시물 저장에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      title,
      category,
      contentJson,
      normalizedFeaturedImage,
      tags,
      isFeatured,
      featuredOrder,
      metrics.estimatedReadTime,
      router,
      isUploadingMedia,
    ],
  );

  const editorDocumentActions = useMemo(
    () => ({
      openSettings: () => setSettingsOpen(true),
      saveDraft: () => void handleSave("draft"),
    }),
    [handleSave],
  )

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as StoredDraft;
      setTitle(parsed.title || '');
      setContentJson(parsed.contentJson || EMPTY_CONTENT);
      setCategory(parsed.category || DEFAULT_POST_CATEGORY);
      setTags(Array.isArray(parsed.tags) ? parsed.tags : []);
      setFeaturedImage(parsed.featuredImage || '');
      setIsFeatured(Boolean(parsed.isFeatured));
      setFeaturedOrder(parsed.featuredOrder || 0);
      setLastDraftSavedAt(parsed.updatedAt || null);
      setRestoredDraft(true);
    } catch (e) {
      console.error('Failed to parse local draft', e);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    const timer = window.setTimeout(() => {
      const payload: StoredDraft = {
        title,
        contentJson,
        category,
        tags,
        featuredImage,
        isFeatured,
        featuredOrder,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setLastDraftSavedAt(payload.updatedAt);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    title,
    contentJson,
    category,
    tags,
    featuredImage,
    isFeatured,
    featuredOrder,
    hasUnsavedChanges,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || isSaving) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!isSaving && !isUploadingMedia) {
          void handleSave('draft');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, isSaving, isUploadingMedia]);

  const notices = (
    <>
      {restoredDraft && (
        <div className="rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-4 text-sm text-brand-blue-700">
          브라우저 임시 저장본을 복구했습니다.
        </div>
      )}

      {error && !settingsOpen && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}
    </>
  );

  return (
    <PostEditorLayout
      title={title}
      onTitleChange={setTitle}
      onExit={handleExit}
      statusLabel={hasUnsavedChanges ? '작성 중' : '초안 비어있음'}
      statusTone={hasUnsavedChanges ? 'accent' : 'neutral'}
      metrics={metrics}
      secondaryMeta={
        lastDraftSavedAt ? (
          <span className="text-neutral-slate-400">
            브라우저 임시저장{' '}
            {new Date(lastDraftSavedAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ) : null
      }
      notices={notices}
      actions={
        <>
          <Button
            onClick={() => void handleSave('draft')}
            variant="outline"
            disabled={isSaving || isUploadingMedia}
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{getActionLabel('draft', isSaving)}</span>
          </Button>

          <Button
            variant="outline"
            disabled={isSaving || isUploadingMedia}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">게시 설정</span>
          </Button>
          <PostSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            authorMessage={
              <>
                작성자는 <strong>{DEFAULT_AUTHOR}</strong>로 자동 지정됩니다.
              </>
            }
            category={category}
            onCategoryChange={setCategory}
            tags={tags}
            onTagsChange={setTags}
            featuredImage={featuredImage}
            featuredImagePreview={normalizedFeaturedImage}
            onFeaturedImageChange={setFeaturedImage}
            onFeaturedImageUpload={handleFeaturedImageUpload}
            isFeatured={isFeatured}
            onFeaturedChange={setIsFeatured}
            featuredOrder={featuredOrder}
            onFeaturedOrderChange={setFeaturedOrder}
            isUploadingImage={isUploadingFeaturedImage}
            isSaving={isSaving}
            error={error}
            footer={
              <Button
                onClick={() => void handleSave('published')}
                className="w-full"
                disabled={isSaving || isUploadingMedia}
              >
                {getActionLabel('published', isSaving)}
              </Button>
            }
          />
        </>
      }
    >
      <TiptapEditor
        content={contentJson}
        onChange={setContentJson}
        className="notion-fullscreen"
        onError={setError}
        onUploadStateChange={setIsUploadingEditorMedia}
        documentActions={editorDocumentActions}
      />
    </PostEditorLayout>
  );
}
