'use client';

import Link from 'next/link';
import { Github, Linkedin, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Panel } from '@/components/ui/panel';

interface Author {
  name: string;
  avatar?: string;
  bio: string;
  githubUrl?: string;
  linkedinUrl?: string;
  email?: string;
}

interface AuthorCardProps {
  author: Author;
}

export function AuthorCard({ author }: AuthorCardProps) {
  const hasLinks = Boolean(
    author.githubUrl || author.linkedinUrl || author.email,
  );

  return (
    <Panel variant="glass" className="relative overflow-hidden p-6">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>

      <div className="relative flex items-start gap-4">
        <Avatar className="w-16 h-16">
          {author.avatar ? (
            <AvatarImage src={author.avatar} alt={author.name} />
          ) : null}
          <AvatarFallback>{author.name?.[0] ?? '?'}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-neutral-slate-800 mb-2">
            {author.name}
          </h3>
          <p className="text-neutral-slate-600 mb-4">{author.bio}</p>

          {hasLinks ? (
            <div className="flex gap-2">
              {author.githubUrl ? (
                <Button
                  variant="brand-outline"
                  size="icon"
                  className="bg-transparent"
                  asChild
                >
                  <Link
                    href={author.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {author.linkedinUrl ? (
                <Button
                  variant="brand-outline"
                  size="icon"
                  className="bg-transparent"
                  asChild
                >
                  <Link
                    href={author.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              {author.email ? (
                <Button
                  variant="brand-outline"
                  size="icon"
                  className="bg-transparent"
                  asChild
                >
                  <Link href={`mailto:${author.email}`}>
                    <Mail className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
