interface CharacterCountProps {
  value?: string | null
  helper?: string
}

export function CharacterCount({ value, helper }: CharacterCountProps) {
  return (
    <p className="mt-1 text-xs text-neutral-slate-500">
      {helper ? `${helper} ` : ""}
      {`${(value || "").trim().length}자`}
    </p>
  )
}
