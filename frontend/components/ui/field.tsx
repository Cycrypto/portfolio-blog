import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-4", className)} {...props} />
))
FieldGroup.displayName = "FieldGroup"

type FieldProps = React.HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean
  invalid?: boolean
  orientation?: "horizontal" | "vertical"
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      className,
      disabled = false,
      invalid = false,
      orientation = "vertical",
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-disabled={disabled ? "true" : undefined}
      data-invalid={invalid ? "true" : undefined}
      data-orientation={orientation}
      className={cn(
        "group/field flex gap-2",
        orientation === "horizontal"
          ? "items-start justify-between gap-4"
          : "flex-col",
        className,
      )}
      {...props}
    />
  ),
)
Field.displayName = "Field"

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(
      "group-data-[disabled=true]/field:text-neutral-slate-400 group-data-[invalid=true]/field:text-destructive",
      className,
    )}
    {...props}
  />
))
FieldLabel.displayName = "FieldLabel"

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-6 text-muted-foreground group-data-[disabled=true]/field:text-neutral-slate-400",
      className,
    )}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"

const FieldError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, className, ...props }, ref) => {
  if (!children) {
    return null
  }

  return (
    <p
      ref={ref}
      role="alert"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FieldError.displayName = "FieldError"

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel }
