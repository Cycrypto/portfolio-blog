interface TiptapViewerProps {
  contentHtml: string
  className?: string
}

export function TiptapViewer({ contentHtml, className = "" }: TiptapViewerProps) {
  return (
    <div className={className}>
      <div
        className="notion-content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  )
}
