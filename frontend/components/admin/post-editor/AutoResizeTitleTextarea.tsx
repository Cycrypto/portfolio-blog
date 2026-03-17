"use client"

import { ChangeEvent, useEffect, useRef } from "react"

interface AutoResizeTitleTextareaProps {
  className?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AutoResizeTitleTextarea({
  className = "",
  value,
  onChange,
  placeholder = "제목 없음",
}: AutoResizeTitleTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const target = textareaRef.current
    if (!target) {
      return
    }

    target.style.height = "auto"
    target.style.height = `${target.scrollHeight}px`
  }, [value])

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  return (
    <textarea
      ref={textareaRef}
      id="title"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      rows={1}
      className={`w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-0 font-black leading-[0.95] tracking-tight text-neutral-slate-800 placeholder:text-neutral-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 text-[clamp(2.75rem,9vw,4.75rem)] ${className}`}
      onInput={(event) => {
        const target = event.currentTarget
        target.style.height = "auto"
        target.style.height = `${target.scrollHeight}px`
      }}
    />
  )
}
