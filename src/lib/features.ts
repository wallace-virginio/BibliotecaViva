/**
 * Funções que ainda NÃO têm dados reais por trás (hoje seriam simuladas). Desligadas, mostram a tela
 * "Em desenvolvimento" com o Ori (src/components/EmDesenvolvimento.tsx) em vez de dados inventados.
 * Quando uma ficar real (ex.: biblioteca conectada por um Provider), troque para true — a tela original
 * continua no código e volta na hora.
 */
export const FEATURES = {
  /** Agenda de eventos, clubes e oficinas das bibliotecas. */
  eventos: false,
  /** Reserva de salas de estudo e computadores. */
  salas: false,
  /** Comunidade: feed, grupos de estudo, ranking de leitores. */
  comunidade: false,
  /** Reserva de livros físicos e "onde retirar" (andar, estante, disponibilidade). */
  reservas: false,
  /** Painel para a equipe da biblioteca. */
  painelBiblioteca: false,
  /** Área do desenvolvedor (SDKs, chaves, conectores). */
  desenvolvedor: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;
