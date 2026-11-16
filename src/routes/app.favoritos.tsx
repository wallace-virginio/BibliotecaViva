import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { DashHeader, SavedBookRow } from "@/components/dashboard";
import { LibraryCard } from "@/components/common";
import { buttonClass, EmptyState } from "@/components/ui";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos — Biblioteca Viva" }, { name: "description", content: "Livros e bibliotecas favoritos." }] }),
  component: Favoritos,
});

function Favoritos() {
  const favorites = useStore((s) => s.favorites);
  const followed = useStore((s) => s.followedLibraries);
  const libs = FEATURED_LIBRARIES.filter((l) => followed.includes(l.slug));
  return (
    <>
      <DashHeader title="Favoritos" description="Livros que você salvou e bibliotecas que você segue." />
      <h2 className="mb-4 text-lg font-semibold">Livros</h2>
      <SavedBookRow
        books={favorites}
        empty={<EmptyState icon={<Heart className="size-6" />} title="Nenhum favorito ainda" description="Toque em Favoritar na página de um livro." action={<Link to="/acervo" className={buttonClass("primary", "sm")}>Explorar acervo</Link>} />}
      />
      <h2 className="mt-10 mb-4 text-lg font-semibold">Bibliotecas que você segue</h2>
      {libs.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{libs.map((l) => <LibraryCard key={l.slug} lib={l} />)}</div>
      ) : (
        <p className="text-sm text-muted-foreground">Siga bibliotecas pelo perfil delas para receber novidades.</p>
      )}
    </>
  );
}
