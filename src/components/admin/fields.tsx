"use client";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button, Field, inputClass, useToast } from "../ui";
import { fieldId, useFieldError } from "./editor-context";

export function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 md:p-6">
      <h3 className="font-heading text-base">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}
export function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}
export function TextField({
  path,
  label,
  value,
  onChange,
  hint,
  placeholder,
  multiline = false,
  rows = 3,
  maxLength,
  type = "text",
}: {
  path: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  type?: string;
}) {
  const id = fieldId(path);
  const error = useFieldError(path);
  const counter =
    maxLength && value.length > maxLength * 0.8
      ? ` (${value.length}/${maxLength})`
      : "";
  return (
    <Field id={id} label={`${label}${counter}`} help={hint} error={error}>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y py-3 leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  );
}
export function SelectField({
  path,
  label,
  value,
  onChange,
  options,
  hint,
}: {
  path: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  const id = fieldId(path);
  const error = useFieldError(path);
  return (
    <Field id={id} label={label} help={hint} error={error}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
// Short phrases (skills, strengths) edited as chips: Enter or comma adds, drag
// or Alt+arrow reorders, Backspace on an empty box removes the last chip.
export function TagField({
  path,
  label,
  value,
  onChange,
  max,
  hint,
  placeholder = "입력 후 Enter",
}: {
  path: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  max: number;
  hint?: string;
  placeholder?: string;
}) {
  const id = fieldId(path);
  const error = useFieldError(path);
  const [draft, setDraft] = useState("");
  const [dragging, setDragging] = useState<number | null>(null);
  const full = value.length >= max;
  const add = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...value, ...parts].slice(0, max));
    setDraft("");
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const chipKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (
      event.altKey &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight")
    ) {
      event.preventDefault();
      move(index, index + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onChange(value.filter((_, i) => i !== index));
    }
  };
  return (
    <Field
      id={id}
      label={`${label} (${value.length}/${max})`}
      help={
        hint ?? "Enter 또는 쉼표로 추가합니다. 끌어서 순서를 바꿀 수 있습니다."
      }
      error={error}
    >
      <div
        className={`flex min-h-11 flex-wrap items-center gap-2 rounded border border-line bg-surface px-2 py-2 focus-within:border-accent ${error ? "border-danger" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget)
            document.getElementById(id)?.focus();
        }}
      >
        {value.map((item, index) => (
          <span
            key={`${item}-${index}`}
            draggable
            onDragStart={() => setDragging(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragging !== null) move(dragging, index);
              setDragging(null);
            }}
            onDragEnd={() => setDragging(null)}
            className={`inline-flex items-center gap-1 rounded bg-ink/5 py-1 pr-1 pl-2 text-sm ${dragging === index ? "opacity-40" : ""}`}
          >
            <GripVertical size={12} className="cursor-grab text-muted" />
            <button
              type="button"
              onKeyDown={(e) => chipKey(e, index)}
              aria-label={`${item} (Alt+화살표로 이동, Delete로 삭제)`}
              className="rounded px-0.5 focus-visible:outline-accent"
            >
              {item}
            </button>
            <button
              type="button"
              aria-label={`${item} 삭제`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="flex size-6 items-center justify-center rounded hover:bg-ink/10"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={full}
          placeholder={full ? "최대 개수에 도달했습니다" : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => add(draft)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (/[,\n]/.test(pasted)) {
              e.preventDefault();
              add(draft + pasted);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length)
              onChange(value.slice(0, -1));
          }}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-base outline-none sm:text-sm"
        />
      </div>
    </Field>
  );
}
// Ordered cards for repeated entries. New cards open with focus on their first
// field; deleted cards can be restored from the toast.
export function ItemList<T>({
  path,
  label,
  items,
  onChange,
  max,
  create,
  summary,
  children,
  emptyHint,
  compact = false,
}: {
  path: string;
  label: string;
  items: T[];
  onChange: (update: (items: T[]) => T[]) => void;
  max: number;
  create: () => T;
  summary: (item: T, index: number) => string;
  children: (
    item: T,
    update: (patch: Partial<T>) => void,
    index: number,
  ) => ReactNode;
  emptyHint?: string;
  compact?: boolean;
}) {
  const toast = useToast();
  const error = useFieldError(path);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  useEffect(() => {
    if (focusIndex === null) return;
    const card = listRef.current?.children[focusIndex] as
      HTMLElement | undefined;
    card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    card
      ?.querySelector<HTMLElement>("input:not([type=file]), textarea, select")
      ?.focus({ preventScroll: true });
    setFocusIndex(null);
  }, [focusIndex]);
  const move = (from: number, to: number) =>
    onChange((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  const remove = (index: number) => {
    const removed = items[index];
    onChange((list) => list.filter((_, i) => i !== index));
    toast(`${label} ${index + 1}을(를) 삭제했습니다.`, {
      action: {
        label: "삭제 취소",
        onClick: () =>
          onChange((list) => [
            ...list.slice(0, index),
            removed,
            ...list.slice(index),
          ]),
      },
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-medium">
          {label}{" "}
          <span className="font-normal text-muted">
            {items.length}/{max}
          </span>
        </p>
        <Button
          variant="secondary"
          disabled={items.length >= max}
          onClick={() => {
            onChange((list) => [...list, create()]);
            setFocusIndex(items.length);
          }}
        >
          <Plus size={14} />
          {label} 추가
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {items.length === 0 && emptyHint && (
        <p className="rounded border border-dashed border-line p-5 text-center text-sm text-muted">
          {emptyHint}
        </p>
      )}
      <div
        ref={listRef}
        className={compact ? "grid gap-3 sm:grid-cols-2" : "space-y-4"}
      >
        {items.map((item, index) => (
          <article
            key={index}
            aria-label={`${label} ${index + 1}`}
            className="rounded-lg border border-line bg-paper/60 p-4"
          >
            <header className="mb-4 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm">
                <span className="mr-2 font-mono text-xs text-accent">
                  {index + 1}
                </span>
                {summary(item, index) || (
                  <span className="text-muted">새 {label}</span>
                )}
              </p>
              <div className="flex shrink-0">
                <Button
                  variant="ghost"
                  disabled={index === 0}
                  aria-label={`${label} ${index + 1} 위로 이동`}
                  onClick={() => move(index, index - 1)}
                  className="min-h-9 px-2"
                >
                  <ArrowUp size={15} />
                </Button>
                <Button
                  variant="ghost"
                  disabled={index === items.length - 1}
                  aria-label={`${label} ${index + 1} 아래로 이동`}
                  onClick={() => move(index, index + 1)}
                  className="min-h-9 px-2"
                >
                  <ArrowDown size={15} />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`${label} ${index + 1} 삭제`}
                  onClick={() => remove(index)}
                  className="min-h-9 px-2 text-danger"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </header>
            <div className="grid gap-4">
              {children(
                item,
                (patch) =>
                  onChange((list) =>
                    list.map((old, i) =>
                      i === index ? { ...old, ...patch } : old,
                    ),
                  ),
                index,
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
