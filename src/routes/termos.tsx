import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { CONTROLLER, TERMS_VERSION } from "@/lib/legal";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Biblioteca Viva" },
      { name: "description", content: "Regras de uso da plataforma Biblioteca Viva." },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <LegalPage
      title="Termos de Uso"
      version={TERMS_VERSION}
      intro={
        <p>
          Estes termos regem o uso da Biblioteca Viva, plataforma aberta para descobrir bibliotecas, eventos, espaços de estudo e livros. Ao criar uma conta ou
          usar o app você concorda com eles e com a <Link to="/privacidade" className="text-primary">Política de Privacidade</Link>.
        </p>
      }
      sections={[
        {
          id: "servico",
          title: "O serviço",
          body: (
            <>
              <p>
                A Biblioteca Viva é oferecida por <strong>{CONTROLLER.name}</strong> ({CONTROLLER.document}). Reunimos informações públicas sobre bibliotecas e livros e
                ferramentas para você organizar leituras, reservas e participação em eventos.
              </p>
              <p>
                Horários, disponibilidade de salas, computadores, exemplares e eventos podem vir de fontes abertas ou ser estimativas até que cada biblioteca conecte
                seu sistema. Confirme com a biblioteca antes de se deslocar. Reservas feitas pelo app dependem da confirmação da biblioteca responsável.
              </p>
            </>
          ),
        },
        {
          id: "conta",
          title: "Sua conta",
          body: (
            <ul>
              <li>Informe dados verdadeiros e mantenha sua senha em sigilo. Você é responsável pelo que for feito com sua conta.</li>
              <li>Menores de 12 anos só podem usar a conta com autorização de um dos pais ou responsável legal; adolescentes devem ter o acompanhamento dos responsáveis.</li>
              <li>Contas de biblioteca devem ser criadas por quem tem autorização para representá-la.</li>
              <li>Você pode excluir sua conta a qualquer momento em Configurações → Privacidade.</li>
            </ul>
          ),
        },
        {
          id: "uso",
          title: "Uso aceitável",
          body: (
            <>
              <p>Não é permitido:</p>
              <ul>
                <li>publicar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos de terceiros;</li>
                <li>tentar acessar dados de outras pessoas, burlar mecanismos de segurança ou sobrecarregar o serviço;</li>
                <li>usar robôs para coletar dados da plataforma em massa;</li>
                <li>fazer reservas falsas ou se passar por outra pessoa ou biblioteca.</li>
              </ul>
              <p>Podemos suspender ou encerrar contas que descumpram estes termos, informando o motivo sempre que possível.</p>
            </>
          ),
        },
        {
          id: "conteudo",
          title: "Conteúdo de terceiros e direitos autorais",
          body: (
            <ul>
              <li>Os livros disponíveis para leitura no app são de domínio público e vêm do Wikisource e do Internet Archive. Obras protegidas não são disponibilizadas.</li>
              <li>Dados de mapas e bibliotecas: © colaboradores do OpenStreetMap, licença ODbL. Informações de livros: Open Library. Fotos: Wikimedia Commons, conforme a licença de cada imagem.</li>
              <li>O código da Biblioteca Viva é aberto sob licença MIT. A marca e a identidade visual pertencem ao responsável pela plataforma.</li>
              <li>Ao avaliar ou comentar, você nos autoriza a exibir esse conteúdo na plataforma, mantendo seus direitos sobre ele.</li>
            </ul>
          ),
        },
        {
          id: "responsabilidade",
          title: "Limites de responsabilidade",
          body: (
            <p>
              O serviço é oferecido como está, buscando funcionar de forma contínua e segura, mas pode ter interrupções. Não respondemos por informações publicadas por
              bibliotecas ou fontes de terceiros, nem por mudanças de horário ou cancelamentos de eventos feitos por elas. Nada nestes termos limita direitos garantidos
              pelo Código de Defesa do Consumidor.
            </p>
          ),
        },
        {
          id: "mudancas",
          title: "Mudanças nos termos",
          body: <p>Podemos atualizar estes termos. Mudanças relevantes serão avisadas no app e exigirão novo aceite para continuar usando a conta.</p>,
        },
        {
          id: "lei",
          title: "Lei aplicável",
          body: <p>Estes termos seguem as leis brasileiras. Fica eleito o foro do domicílio do usuário para resolver qualquer controvérsia.</p>,
        },
      ]}
    />
  );
}
