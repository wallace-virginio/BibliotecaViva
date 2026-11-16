import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "glass";
type Size = "sm" | "md" | "lg" | "icon";

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
    {
      primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110 hover:-translate-y-0.5",
      secondary: "bg-foreground text-background hover:opacity-90 hover:-translate-y-0.5",
      outline: "border border-border-strong bg-surface text-foreground hover:border-primary hover:text-primary",
      ghost: "text-foreground hover:bg-surface-2",
      soft: "bg-primary-soft text-primary-soft-foreground hover:brightness-95",
      glass: "glass border text-foreground hover:bg-surface",
    }[variant],
    {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-5 text-sm",
      lg: "h-13 px-7 text-base",
      icon: "size-10",
    }[size],
    className,
  );

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ variant, size, className, ...props }, ref) => (
  <button ref={ref} className={buttonClass(variant, size, className)} {...props} />
));
Button.displayName = "Button";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "glass";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          neutral: "bg-surface-2 text-muted-foreground",
          primary: "bg-primary-soft text-primary-soft-foreground",
          success: "bg-success-soft text-success",
          warning: "bg-warning-soft text-warning",
          danger: "bg-danger-soft text-danger",
          glass: "glass border text-foreground",
        }[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border bg-surface shadow-soft", className)} {...props} />;
}

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-3 md:mb-14",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-3", align === "center" && "items-center")}>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</span>
        )}
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance md:text-5xl">{title}</h2>
        {description && (
          <p className="max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", className)}>
      <Star className="size-4 fill-star text-star" />
      {value.toFixed(1).replace(".", ",")}
    </span>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border bg-surface px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-surface-2/50 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-full border bg-surface-2 p-1 scrollbar-none", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
            value === o.value ? "bg-surface text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
