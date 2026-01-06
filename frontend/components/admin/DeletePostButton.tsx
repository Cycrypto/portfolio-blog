"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deletePost } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DeletePostButtonProps {
  postId: string
  postTitle: string
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

export function DeletePostButton({ 
  postId, 
  postTitle, 
  variant = "outline", 
  size = "sm" 
}: DeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm(`"${postTitle}" 포스트를 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      setIsDeleting(true)
      await deletePost(postId)
      
      toast({
        title: "삭제 성공",
        description: "포스트가 성공적으로 삭제되었습니다.",
      })
      
      // 블로그 목록 페이지로 이동
      router.push("/blog")
    } catch (err) {
      toast({
        title: "삭제 실패",
        description: "포스트 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      console.error('Error deleting post:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-500 hover:text-red-700"
    >
      {isDeleting ? (
        "삭제 중..."
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
    </Button>
  )
} 