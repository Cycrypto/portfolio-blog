'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JSONContent } from '@tiptap/react';
import { Save, Settings2 } from 'lucide-react';

import { PostEditorLayout } from '@/components/admin/post-editor/PostEditorLayout';
import { PostSettingsDialog } from '@/components/admin/post-editor/PostSettingsDialog';
import { useFeaturedImageUpload } from '@/components/admin/post-editor/useFeaturedImageUpload';
import { Button } from '@/components/ui/button';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { TiptapViewer } from '@/components/editor/TiptapViewer';
import {
  convertPostToTiptap,
  getPostForEdit,
  updatePost,
  type PostEdit,
  type UpdatePostRequest,
} from '@/lib/api';
import { normalizeImageUrl } from '@/lib/utils/image';
import { calculateEditorMetrics } from '@/lib/posts/editor-metrics';
import { getPostPath } from '@/lib/posts/post-url';

const EMPTY_CONTENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};
const DEFAULT_AUTHOR = '박준하';

type SaveStatus = 'draft' | 'published' | 'scheduled';

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

const getActionLabel = (status: SaveStatus, isSaving: boolean) => {
  if (!isSaving) {
    if (status === 'draft') {
      return '임시저장';
    }

    if (status === 'published') {
      return '게시 반영';
    }

    return '저장';
  }

  if (status === 'draft') {
    return '저장 중...';
  }

  if (status === 'published') {
    return '반영 중...';
  }

  return '저장 중...';
};

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [post, setPost] = useState<PostEdit | null>(null);
  const [title, setTitle] = useState('');
  const [contentJson, setContentJson] = useState<JSONContent>(EMPTY_CONTENT);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState(0);
  const [contentType, setContentType] = useState<'tiptap' | 'markdown'>(
    'tiptap',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingEditorMedia, setIsUploadingEditorMedia] = useState(false);
  const [isConvertingMarkdown, setIsConvertingMarkdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const metrics = useMemo(
    () => calculateEditorMetrics(contentJson),
    [contentJson],
  );
  const normalizedFeaturedImage = useMemo(
    () => normalizeImageUrl(featuredImage),
    [featuredImage],
  );
  const normalizedOriginalImage = useMemo(
    () => normalizeImageUrl(post?.image),
    [post?.image],
  );
  const { handleFeaturedImageUpload, isUploadingFeaturedImage } =
    useFeaturedImageUpload({
      setError,
      setFeaturedImage,
    });
  const isUploadingMedia = isUploadingFeaturedImage || isUploadingEditorMedia;
  const isBusy = isSaving || isUploadingMedia || isConvertingMarkdown;

  const originalTagsKey = useMemo(
    () => [...(post?.tags || [])].sort().join('|'),
    [post?.tags],
  );
  const currentTagsKey = useMemo(() => [...tags].sort().join('|'), [tags]);

  const isContentChanged = useMemo(() => {
    if (!post || contentType !== 'tiptap') {
      return false;
    }

    const previousJson = (post.contentJson as JSONContent) || EMPTY_CONTENT;
    return (
      JSON.stringify(contentJson || EMPTY_CONTENT) !==
      JSON.stringify(previousJson)
    );
  }, [post, contentType, contentJson]);

  const hasUnsavedChanges =
    !!post &&
    (title.trim() !== post.title ||
      category !== post.category ||
      currentTagsKey !== originalTagsKey ||
      normalizedFeaturedImage !== normalizedOriginalImage ||
      isFeatured !== post.isFeatured ||
      featuredOrder !== post.featuredOrder ||
      isContentChanged);

  const applyPostState = useCallback((postData: PostEdit) => {
    const nextContentJson =
      (postData.contentJson as JSONContent) || EMPTY_CONTENT;

    setPost(postData);
    setTitle(postData.title);
    setContentType(postData.contentType);
    setContentJson(nextContentJson);
    setCategory(postData.category);
    setTags(postData.tags || []);
    setFeaturedImage(normalizeImageUrl(postData.image) || '');
    setIsFeatured(Boolean(postData.isFeatured));
    setFeaturedOrder(postData.featuredOrder || 0);
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostForEdit(id);
        applyPostState(postData);
      } catch (err) {
        setError('포스트를 불러오는데 실패했습니다.');
        console.error('Error fetching post:', err);
      }
    };

    fetchPost();
  }, [id, applyPostState]);

  useEffect(() => {
    if (hasUnsavedChanges && success) {
      setSuccess(null);
    }
  }, [hasUnsavedChanges, success]);

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

  const handleExit = () => {
    if (
      hasUnsavedChanges &&
      !confirm('저장되지 않은 변경사항이 있습니다. 나가시겠습니까?')
    ) {
      return;
    }
    router.push('/admin/posts');
  };

  const buildPostUpdatePayload = useCallback(
    (saveStatus: SaveStatus): UpdatePostRequest => {
      if (!post) return {};

      const payload: UpdatePostRequest = {};

      if (title.trim() !== post.title) {
        payload.title = title.trim();
      }

      if (contentType === 'tiptap' && isContentChanged) {
        payload.contentType = 'tiptap';
        payload.contentJson = contentJson || EMPTY_CONTENT;
      }

      if (category !== post.category) {
        payload.category = category;
      }

      if (currentTagsKey !== originalTagsKey) {
        payload.tags = tags.length > 0 ? tags : undefined;
      }

      if (normalizedFeaturedImage !== normalizedOriginalImage) {
        payload.image = normalizedFeaturedImage;
      }

      if (isFeatured !== post.isFeatured) {
        payload.isFeatured = isFeatured;
      }

      if ((isFeatured ? featuredOrder : 0) !== post.featuredOrder) {
        payload.featuredOrder = isFeatured ? featuredOrder : 0;
      }

      if (saveStatus !== post.status) {
        payload.status = saveStatus;
      }

      if (!post.author?.trim()) {
        payload.author = DEFAULT_AUTHOR;
      }

      return payload;
    },
    [
      post,
      title,
      contentType,
      isContentChanged,
      contentJson,
      category,
      currentTagsKey,
      originalTagsKey,
      tags,
      normalizedFeaturedImage,
      normalizedOriginalImage,
      isFeatured,
      featuredOrder,
    ],
  );

  const handleSave = useCallback(
    async (saveStatus: SaveStatus) => {
      if (!post) return;

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

        const postData = buildPostUpdatePayload(saveStatus);

        if (Object.keys(postData).length === 0) {
          if (saveStatus === 'published' && post.status === 'published') {
            router.push(getPostPath(post));
            return;
          }

          setError('변경된 내용이 없습니다.');
          return;
        }

        const updatedPost = await updatePost(id, postData);

        if (saveStatus === 'published') {
          router.push(getPostPath(updatedPost));
          return;
        }

        const refreshedPost = await getPostForEdit(id);
        applyPostState(refreshedPost);

        setSuccess('임시저장을 완료했습니다.');
      } catch (err) {
        console.error('Error updating post:', err);
        setError('포스트 수정에 실패했습니다.');
      } finally {
        setIsSaving(false);
      }
    },
    [
      post,
      title,
      category,
      buildPostUpdatePayload,
      id,
      isUploadingMedia,
      applyPostState,
      router,
    ],
  );

  const editorDocumentActions = useMemo(
    () => ({
      openSettings: () => setSettingsOpen(true),
      saveDraft: () => void handleSave("draft"),
    }),
    [handleSave],
  )

  const handleConvertMarkdown = useCallback(async () => {
    if (!post || contentType !== 'markdown') {
      return;
    }

    if (
      !confirm('Markdown 레거시 글을 Tiptap 에디터 형식으로 변환하시겠습니까?')
    ) {
      return;
    }

    try {
      setIsConvertingMarkdown(true);
      setError(null);
      setSuccess(null);

      const metadataPayload = buildPostUpdatePayload(post.status as SaveStatus);
      const convertedPost = await convertPostToTiptap(id, metadataPayload);
      applyPostState(convertedPost);
      setSuccess('Markdown 글을 Tiptap 에디터 형식으로 변환했습니다.');
    } catch (err) {
      console.error('Error converting markdown post:', err);
      setError(
        err instanceof Error ? err.message : 'Markdown 글 변환에 실패했습니다.',
      );
    } finally {
      setIsConvertingMarkdown(false);
    }
  }, [post, contentType, buildPostUpdatePayload, id, applyPostState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!isSaving && !isUploadingMedia && !isConvertingMarkdown) {
          void handleSave('draft');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, isSaving, isUploadingMedia, isConvertingMarkdown]);

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">포스트를 불러오는 중...</div>
      </div>
    );
  }

  const notices = (
    <>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-600">
          {success}
        </div>
      )}
    </>
  );

  return (
    <PostEditorLayout
      title={title}
      onTitleChange={setTitle}
      onExit={handleExit}
      statusLabel={hasUnsavedChanges ? '저장 필요' : '동기화됨'}
      statusTone={hasUnsavedChanges ? 'accent' : 'neutral'}
      metrics={metrics}
      notices={notices}
      actions={
        <>
          <Button
            onClick={() => void handleSave('draft')}
            variant="outline"
            disabled={isBusy}
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{getActionLabel('draft', isSaving)}</span>
          </Button>

          <Button
            variant="outline"
            disabled={isBusy}
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
                작성자는 <strong>{post.author || DEFAULT_AUTHOR}</strong>로 고정됩니다.
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
            isSaving={isBusy}
            error={error}
            footer={
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() => void handleSave('draft')}
                  variant="outline"
                  disabled={isBusy}
                >
                  {getActionLabel('draft', isSaving)}
                </Button>
                <Button
                  onClick={() => void handleSave('published')}
                  disabled={isBusy}
                >
                  {getActionLabel('published', isSaving)}
                </Button>
              </div>
            }
          />
        </>
      }
    >
      {contentType === 'markdown' ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-900">
                이 글은 Markdown 레거시 포스트입니다.
              </p>
              <p className="text-sm text-amber-800">
                현재 화면에서 바로 Tiptap 에디터 형식으로 변환할 수 있습니다. 제목, 태그, 대표 이미지 같은 메타데이터 변경도 함께 반영됩니다.
              </p>
            </div>
            <Button
              onClick={() => void handleConvertMarkdown()}
              disabled={isBusy}
            >
              {isConvertingMarkdown ? '변환 중...' : '변환 후 계속 편집'}
            </Button>
          </div>
          {post.contentHtml ? (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <TiptapViewer contentHtml={post.contentHtml} />
            </div>
          ) : null}
        </div>
      ) : (
        <TiptapEditor
          content={contentJson}
          onChange={setContentJson}
          className="notion-fullscreen"
          onError={setError}
          onUploadStateChange={setIsUploadingEditorMedia}
          documentActions={editorDocumentActions}
        />
      )}
    </PostEditorLayout>
  );
}
