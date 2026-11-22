import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "glass";
type Size = "sm" | "md" | "lg" | "icon";

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(
    "ripple inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-300 ease-[var(--ease-out)] select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
    {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
      secondary: "bg-foreground text-background hover:opacity-90",
      outline: "border border-border-strong bg-surface text-foreground hover:border-primary hover:text-primary",
      ghost: "text-foreground hover:bg-surface-2",
      soft: "bg-primary-soft text-primary-soft-foreground hover:brightness-95",
      glass: "border bg-surface text-foreground hover:bg-surface-2",
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
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
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
  className,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** mantido por compatibilidade; o cabeçalho agora é sempre alinhado à esquerda, como em jornal */
  align?: "center" | "left";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("rule-top mb-8 flex flex-col gap-3 pt-4 md:mb-10 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex max-w-3xl flex-col gap-2">
        {eyebrow && <span className="kicker">{eyebrow}</span>}
        <h2 className="text-3xl leading-tight text-balance md:text-4xl">{title}</h2>
        {description && <p className="max-w-2xl text-base text-pretty text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
