import Image from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewProps } from '@tiptap/core'
import { useRef, useState, useEffect } from 'react'

function ResizableImageComponent({ node, updateAttributes }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (imgRef.current && imgRef.current.naturalWidth && imgRef.current.naturalHeight) {
      setAspectRatio(imgRef.current.naturalWidth / imgRef.current.naturalHeight)
    }
  }, [node.attrs.src])

  const handleMouseDown = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = containerRef.current?.offsetWidth || 0
    const startHeight = containerRef.current?.offsetHeight || 0

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      if (direction === 'se') {
        newWidth = startWidth + deltaX
      } else if (direction === 'sw') {
        newWidth = startWidth - deltaX
      } else if (direction === 'ne') {
        newWidth = startWidth + deltaX
      } else if (direction === 'nw') {
        newWidth = startWidth - deltaX
      }

      // 종횡비 유지
      newHeight = newWidth / aspectRatio

      // 최소/최대 크기 제한
      newWidth = Math.max(50, Math.min(newWidth, 1000))
      newHeight = newWidth / aspectRatio

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <div
        ref={containerRef}
        className={`relative inline-block ${isResizing ? 'resizing' : ''}`}
        style={{
          width: node.attrs.width ? `${node.attrs.width}px` : 'auto',
          maxWidth: '100%',
        }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className="rounded-lg max-w-full h-auto"
          style={{
            width: '100%',
            height: 'auto',
          }}
        />

        {/* Resize handles */}
        <div
          className="resize-handle resize-handle-se"
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />
        <div
          className="resize-handle resize-handle-sw"
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        <div
          className="resize-handle resize-handle-ne"
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        <div
          className="resize-handle resize-handle-nw"
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
      </div>
    </NodeViewWrapper>
  )
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {}
          }
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height'),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {}
          }
          return { height: attributes.height }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})
