import { Link } from "@tanstack/react-router";
import { CURATIONS, FEATURED_LIBRARIES } from "@/data/libraries";
import { LibraryImage, Reveal } from "./common";

/** Coleções com a foto de uma biblioteca real de cada uma (e a contagem verdadeira). */
export function CurationGrid() {
  // cada coleção ganha a foto de uma biblioteca diferente (foto repetida parece feita por máquina)
  const used = new Set<string>();
  const covers = CURATIONS.map((c) => {
    const libs = FEATURED_LIBRARIES.filter((l) => l.curations.includes(c.key));
    const cover = libs.find((l) => l.wiki && !used.has(l.slug)) ?? libs.find((l) => !used.has(l.slug)) ?? libs[0];
    if (cover) used.add(cover.slug);
    return cover;
  });
  return (
    <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {CURATIONS.map((c, i) => {
        const libs = FEATURED_LIBRARIES.filter((l) => l.curations.includes(c.key));
        const cover = covers[i];
        return (
          <Reveal key={c.key} delay={(i % 4) * 60}>
            <Link to="/descobrir" hash={c.key} className="group block">
              <figure className="overflow-hidden rounded-lg">
                {cover ? (
                  <LibraryImage lib={cover} className="aspect-[4/3] w-full transition duration-700 group-hover:scale-[1.03]" />
                ) : (
                  <div className="aspect-[4/3] bg-surface-3" />
                )}
              </figure>
              <h3 className="mt-3 font-serif text-xl leading-snug font-semibold group-hover:text-primary">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              <p className="caption mt-2">
                {libs.length} {libs.length === 1 ? "biblioteca" : "bibliotecas"}
                {cover ? ` · na foto: ${cover.name}` : ""}
              </p>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
