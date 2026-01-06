"use client"

import Link from "next/link"
import { Github, Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Author {
  name: string
  avatar: string
  bio: string
}

interface AuthorCardProps {
  author: Author
}

export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>

      <div className="relative flex items-start gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.name} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-neutral-slate-800 mb-2">{author.name}</h3>
          <p className="text-neutral-slate-600 mb-4">{author.bio}</p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-brand-blue-200 text-brand-blue-600 hover:bg-brand-blue-50 bg-transparent"
              asChild
            >
              <Link href="https://github.com/parkjunha" target="_blank">
                <Github className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-brand-blue-200 text-brand-blue-600 hover:bg-brand-blue-50 bg-transparent"
              asChild
            >
              <Link href="https://linkedin.com/in/parkjunha" target="_blank">
                <Linkedin className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-brand-blue-200 text-brand-blue-600 hover:bg-brand-blue-50 bg-transparent"
              asChild
            >
              <Link href="mailto:parkjunha@example.com">
                <Mail className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
