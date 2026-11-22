/**
 * Em qual "produto" este bundle roda.
 *
 * - App (celular, Capacitor): foco nas pessoas — abre na tela Início do app, com abas próprias.
 * - Site (Cloudflare): usado principalmente pelas bibliotecas — home editorial, painel, área de desenvolvedor.
 *
 * É uma constante de build (VITE_APP=1 em scripts/build-mobile.mjs), não uma detecção em tempo de
 * execução: assim o HTML pré-renderizado e o React no aparelho sempre mostram a mesma coisa.
 * Para ver a experiência do app no navegador: `npm run dev:app`.
 */
export const IS_APP = import.meta.env.VITE_APP === "1";

/** Endereço público do site — usado em links que saem do app (compartilhar, e-mails). */
export const PUBLIC_SITE_URL = "https://biblioteca-viva.biblioteca-viva.workers.dev";
