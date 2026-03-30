"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitContact } from "@/lib/api"
import { trackEvent, trackEventOncePerSession } from "@/lib/analytics/track"

type ContactPayload = {
  email: string
  message: string
  name: string
  subject: string
}

type ContactFieldErrors = Partial<Record<keyof ContactPayload, string>>

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ContactFieldErrors>({})

  const clearFieldError = (field: keyof ContactPayload) => {
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const validatePayload = (payload: ContactPayload) => {
    const nextErrors: ContactFieldErrors = {}

    if (!payload.name) {
      nextErrors.name = "이름을 입력해주세요."
    }

    if (!payload.email) {
      nextErrors.email = "답변 받을 이메일을 입력해주세요."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      nextErrors.email = "올바른 이메일 형식으로 입력해주세요."
    }

    if (!payload.subject) {
      nextErrors.subject = "문의 주제를 입력해주세요."
    }

    if (!payload.message) {
      nextErrors.message = "문의 내용을 입력해주세요."
    }

    return nextErrors
  }

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

    const nextErrors = validatePayload(payload)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toast.error("필수 항목을 모두 입력해주세요.")
      setIsSubmitting(false)
      return
    }

    try {
      setErrors({})
      await submitContact(payload)
      trackEvent("contact_submit_success", {
        location: "contact_section",
      })
      toast.success("문의가 접수되었습니다.", {
        description: "확인 후 답변드리겠습니다.",
      })
      form.reset()
    } catch (error) {
      console.error('Failed to submit contact form', error)
      toast.error("전송하지 못했습니다.", {
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
          <h3 className="mb-6 text-2xl font-bold text-neutral-slate-800">메시지 보내기</h3>

          <form
            onSubmit={handleSubmit}
            onFocusCapture={trackFormStart}
            className="flex flex-col gap-5"
          >
            <FieldGroup>
              <Field invalid={Boolean(errors.name)} disabled={isSubmitting}>
                <FieldLabel htmlFor="contact-name">이름</FieldLabel>
                <Input
                  id="contact-name"
                  name="name"
                  placeholder="이름 또는 닉네임"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)}
                  onChange={() => clearFieldError("name")}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field invalid={Boolean(errors.email)} disabled={isSubmitting}>
                <FieldLabel htmlFor="contact-email">이메일</FieldLabel>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="이메일"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email)}
                  onChange={() => clearFieldError("email")}
                />
                <FieldDescription>
                  답변 받을 주소를 남겨주세요.
                </FieldDescription>
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field invalid={Boolean(errors.subject)} disabled={isSubmitting}>
                <FieldLabel htmlFor="contact-subject">문의 주제</FieldLabel>
                <Input
                  id="contact-subject"
                  name="subject"
                  placeholder="제목"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.subject)}
                  onChange={() => clearFieldError("subject")}
                />
                <FieldError>{errors.subject}</FieldError>
              </Field>

              <Field invalid={Boolean(errors.message)} disabled={isSubmitting}>
                <FieldLabel htmlFor="contact-message">문의 내용</FieldLabel>
                <Textarea
                  id="contact-message"
                  name="message"
                  placeholder="간단히 남겨주세요"
                  rows={5}
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.message)}
                  onChange={() => clearFieldError("message")}
                />
                <FieldDescription>
                  필요한 배경이나 협업 방식이 있으면 함께 적어주세요.
                </FieldDescription>
                <FieldError>{errors.message}</FieldError>
              </Field>
            </FieldGroup>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>전송 중...</>
              ) : (
                <>
                  메시지 보내기 <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
