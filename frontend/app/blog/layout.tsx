import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: '기술 글 | 박준하 포트폴리오',
  description: '문제 해결 과정과 구현 판단을 기록한 기술 글 목록입니다.',
  alternates: {
    canonical: absoluteUrl('/blog'),
  },
  openGraph: {
    title: '기술 글 | 박준하 포트폴리오',
    description: '문제 해결 과정과 구현 판단을 기록한 기술 글 목록입니다.',
    url: absoluteUrl('/blog'),
    type: 'website',
  },
};

export default function BlogLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
