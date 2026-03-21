'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

import { uploadMedia } from '@/lib/api';

interface UseFeaturedImageUploadOptions {
  setError: Dispatch<SetStateAction<string | null>>;
  setFeaturedImage: Dispatch<SetStateAction<string>>;
}

export function useFeaturedImageUpload({
  setError,
  setFeaturedImage,
}: UseFeaturedImageUploadOptions) {
  const [isUploadingFeaturedImage, setIsUploadingFeaturedImage] =
    useState(false);

  const handleFeaturedImageUpload = useCallback(
    async (file: File) => {
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
    },
    [setError, setFeaturedImage],
  );

  return {
    handleFeaturedImageUpload,
    isUploadingFeaturedImage,
  };
}
