import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { buttonClass } from "./ui";

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 pt-24 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
        <Compass className="size-7" />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-md text-muted-foreground">Este capítulo ainda não foi escrito. Que tal descobrir o que existe perto de você?</p>
      <Link to="/" className={buttonClass("primary", "md")}>
        Voltar para o início
      </Link>
    </div>
  );
}
