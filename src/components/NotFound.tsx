import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { buttonClass } from "./ui";
import { useT } from "@/lib/i18n";

export function NotFound() {
  const t = useT();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 pt-24 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
        <Compass className="size-7" />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">{t.notFound.title}</h1>
      <p className="max-w-md text-muted-foreground">{t.notFound.text}</p>
      <Link to="/" className={buttonClass("primary", "md")}>
        {t.notFound.cta}
      </Link>
    </div>
  );
}
