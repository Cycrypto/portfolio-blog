"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitContact } from "@/lib/api"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmitting(true)

    const formData = new FormData(form)
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
    }

    if (!payload.name || !payload.email || !payload.message) {
      toast.error("필수 항목을 모두 입력해주세요.")
      setIsSubmitting(false)
      return
    }

    try {
      await submitContact(payload)
      toast.success("메시지가 전송되었습니다!", {
        description: "연락해 주셔서 감사합니다. 빠른 시일 내에 답변드리겠습니다.",
      })
      form.reset()
    } catch (error) {
      console.error('Failed to submit contact form', error)
      toast.error("메시지 전송에 실패했습니다.", {
        description: "잠시 후 다시 시도해주세요.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6 transition-all duration-300 hover:border-brand-blue-200/50">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25 hover:opacity-100 transition duration-1000 hover:duration-200"></div>

        <div className="relative">
          <h3 className="text-2xl font-bold mb-6 text-neutral-slate-800">메시지 보내기</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                name="name"
                placeholder="이름"
                required
                className="bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600 focus:ring-brand-indigo-600/20"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="email"
                type="email"
                placeholder="이메일"
                required
                className="bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600 focus:ring-brand-indigo-600/20"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="subject"
                placeholder="제목"
                required
                className="bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600 focus:ring-brand-indigo-600/20"
              />
            </div>
            <div className="space-y-2">
              <Textarea
                name="message"
                placeholder="메시지"
                rows={5}
                required
                className="bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600 focus:ring-brand-indigo-600/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>전송 중...</>
              ) : (
                <>
                  메시지 전송 <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
