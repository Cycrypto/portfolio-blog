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
import { trackEvent, trackEventOncePerSession } from "@/lib/analytics/track"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trackFormStart = () => {
    trackEventOncePerSession("contact_form_start", "contact-form:start:home", {
      location: "contact_section",
    })
  }

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
      trackEvent("contact_submit_success", {
        location: "contact_section",
      })
      toast.success("문의가 접수되었습니다.", {
        description: "내용을 확인한 뒤 답변드리겠습니다.",
      })
      form.reset()
    } catch (error) {
      console.error('Failed to submit contact form', error)
      toast.error("문의 전송에 실패했습니다.", {
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
      transition={{ duration: 0.35 }}
      viewport={{ once: true }}
    >
      <div className="surface-elevated p-6">
        <div>
          <h3 className="text-2xl font-bold mb-6 text-neutral-slate-800">문의 남기기</h3>

          <form onSubmit={handleSubmit} onFocusCapture={trackFormStart} className="space-y-6">
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
                placeholder="답변 받을 이메일"
                required
                className="bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600 focus:ring-brand-indigo-600/20"
              />
            </div>
            <div className="space-y-2">
              <Input
                name="subject"
                placeholder="문의 주제"
                required
                className="bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600 focus:ring-brand-indigo-600/20"
              />
            </div>
            <div className="space-y-2">
              <Textarea
                name="message"
                placeholder="문의 내용을 적어주세요"
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
                  문의 보내기 <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
