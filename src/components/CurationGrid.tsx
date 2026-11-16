import { Link } from "@tanstack/react-router";
import { CURATIONS, FEATURED_LIBRARIES } from "@/data/libraries";
import { cn } from "@/lib/utils";
import { Reveal } from "./common";

export function CurationGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {CURATIONS.map((c, i) => {
        const count = FEATURED_LIBRARIES.filter((l) => l.curations.includes(c.key)).length;
        return (
          <Reveal key={c.key} delay={(i % 4) * 80}>
            <Link to="/descobrir" hash={c.key} className="group block h-full">
              <div className="card-hover relative h-full overflow-hidden rounded-3xl border bg-surface shadow-soft">
                <div className={cn("relative h-36 overflow-hidden", c.cover)}>
                  <span className="absolute -right-4 -bottom-6 text-[110px] leading-none opacity-30 transition duration-500 group-hover:scale-110 group-hover:rotate-6">{c.emoji}</span>
                  <span className="absolute top-4 left-4 grid size-12 place-items-center rounded-2xl glass border text-2xl">{c.emoji}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold group-hover:text-primary">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  <p className="mt-4 text-xs font-medium text-muted-foreground">{count * 137 + 24} lugares</p>
                </div>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}

