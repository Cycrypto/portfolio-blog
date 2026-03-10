"use client"

import { ChangeEvent, useEffect, useRef } from "react"

interface AutoResizeTitleTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AutoResizeTitleTextarea({
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
      className="mb-8 w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-7xl font-black leading-tight placeholder:text-neutral-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
      style={{ fontSize: "4.5rem" }}
      onInput={(event) => {
        const target = event.currentTarget
        target.style.height = "auto"
        target.style.height = `${target.scrollHeight}px`
      }}
    />
  )
}
