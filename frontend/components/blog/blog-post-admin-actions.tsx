"use client"

import Link from "next/link"
import { Edit, PenSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeletePostButton } from "@/components/admin/DeletePostButton"
import { useAdminAuth } from "@/hooks/use-admin-auth"

interface BlogPostAdminActionsProps {
  postId: string
  postTitle: string
}

export function BlogPostAdminActions({ postId, postTitle }: BlogPostAdminActionsProps) {
  const isAdmin = useAdminAuth()

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/posts/new">
          <PenSquare className="h-4 w-4 mr-1" />
          새 글
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/posts/${postId}/edit`}>
          <Edit className="h-4 w-4 mr-1" />
          편집
        </Link>
      </Button>
      <DeletePostButton postId={postId} postTitle={postTitle} variant="outline" size="sm" />
    </>
  )
}
