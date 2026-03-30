'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics/track';
import { normalizeImageUrl } from '@/lib/utils/image';
import { getProjectPath } from '@/lib/projects/project-url';

interface ProjectCardProps {
  id: number | string;
  slug?: string | null;
  title: string;
  description?: string;
  tags?: string[];
  image?: string;
  demoUrl?: string;
  repoUrl?: string;
  trackingLocation?: string;
}

export function ProjectCard({
  id,
  slug,
  title,
  description = '',
  tags = [],
  image,
  repoUrl = '',
  trackingLocation = 'project_list_card',
}: ProjectCardProps) {
  const normalizedImage = normalizeImageUrl(image);
  const projectDescription =
    description.trim() || '프로젝트 요약을 준비 중입니다.';
  const projectPath = getProjectPath({ id, slug });
  const contentId = String(id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="surface-elevated h-full overflow-hidden">
        <div className="flex h-full flex-col">
          {normalizedImage && (
            <div className="relative h-48 overflow-hidden">
              <Image
                src={normalizedImage}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className="p-6 flex-grow">
            <Link
              href={projectPath}
              onClick={() => {
                trackEvent('cta_click', {
                  location: trackingLocation,
                  target: 'project',
                  content_id: contentId,
                });
              }}
            >
              <h3 className="text-xl font-bold mb-2 text-neutral-slate-800 hover:text-brand-blue-600 transition-colors cursor-pointer">
                {title}
              </h3>
            </Link>
            <p className="text-neutral-slate-600 mb-4 line-clamp-3">
              {projectDescription}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag, index) => (
                <Badge key={index} variant="brand">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex justify-between mt-auto pt-4 border-t border-neutral-slate-200">
              {repoUrl ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neutral-slate-600 hover:text-neutral-slate-800 hover:bg-slate-100"
                  asChild
                >
                  <Link
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent('project_outbound_click', {
                        project_id: contentId,
                        target: 'repo',
                        location: trackingLocation,
                      });
                    }}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    코드 보기
                  </Link>
                </Button>
              ) : (
                <span className="inline-flex items-center text-sm text-neutral-slate-400">
                  코드 비공개
                </span>
              )}
              <Button size="sm" variant="brand" asChild>
                <Link
                  href={projectPath}
                  onClick={() => {
                    trackEvent('cta_click', {
                      location: trackingLocation,
                      target: 'project',
                      content_id: contentId,
                    });
                  }}
                >
                  자세히 보기
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
