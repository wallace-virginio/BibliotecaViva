import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { CONTROLLER, PRIVACY_VERSION } from "@/lib/legal";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Biblioteca Viva" },
      { name: "description", content: "Como a Biblioteca Viva coleta, usa, compartilha e protege seus dados pessoais, de acordo com a LGPD." },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <LegalPage
      title="Política de Privacidade"
      version={PRIVACY_VERSION}
      intro={
        <p>
          Esta política explica, em linguagem simples, quais dados pessoais a Biblioteca Viva trata, para quê, com quem compartilha e como você exerce seus
          direitos, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).
        </p>
      }
      sections={[
        {
          id: "controlador",
          title: "Quem é o responsável pelos seus dados",
          body: (
            <>
              <p>
                O controlador dos dados é <strong>{CONTROLLER.name}</strong>, {CONTROLLER.document}, {CONTROLLER.address}.
              </p>
              <p>
                Encarregado pelo tratamento de dados (DPO): <strong>{CONTROLLER.dpoName}</strong> — <a href={`mailto:${CONTROLLER.dpoEmail}`} className="text-primary">{CONTROLLER.dpoEmail}</a>.
              </p>
            </>
          ),
        },
        {
          id: "dados",
          title: "Quais dados tratamos",
          body: (
            <>
              <p><strong>Quando você cria uma conta:</strong></p>
              <ul>
                <li>e-mail, nome e tipo de conta (leitor ou biblioteca);</li>
                <li>se entrar com Google ou Apple: o nome, e-mail e foto que esses serviços compartilham com a sua autorização;</li>
                <li>registro dos seus aceites (documento, versão, data e navegador usado).</li>
              </ul>
              <p><strong>Enquanto você usa o app:</strong></p>
              <ul>
                <li>livros favoritos, reservas, inscrições em eventos, histórico de livros vistos e progresso de leitura;</li>
                <li>bibliotecas que você segue e preferências (tema, tamanho da fonte, modo desenvolvedor).</li>
              </ul>
              <p><strong>Localização:</strong> só quando você escolhe — autorizando o GPS do aparelho ou digitando a cidade. Ela fica guardada <strong>apenas neste aparelho, durante a sessão</strong> (some ao fechar o navegador/app), para não precisar perguntar de novo em cada tela, e <strong>não é enviada aos nossos servidores</strong>.</p>
              <p><strong>Dados técnicos:</strong> endereço IP, tipo de aparelho e navegador, registrados pela nossa infraestrutura para segurança e funcionamento do serviço.</p>
              <p>
                <strong>Não pedimos dados sensíveis</strong> (origem racial, religião, opinião política, saúde etc.). Como o histórico de leitura pode indiretamente revelar
                interesses pessoais, ele é tratado com sigilo, fica acessível só a você e nunca é usado para publicidade ou perfilamento.
              </p>
            </>
          ),
        },
        {
          id: "finalidades",
          title: "Para que usamos e com qual base legal",
          body: (
            <ul>
              <li><strong>Criar e manter sua conta, sincronizar seus livros e reservas entre aparelhos</strong> — execução do contrato (art. 7º, V).</li>
              <li><strong>Mostrar bibliotecas perto de você com GPS</strong> — consentimento (art. 7º, I), que você dá no momento do uso e pode negar.</li>
              <li><strong>Segurança, prevenção de fraudes e abusos, e melhoria técnica do serviço</strong> — legítimo interesse (art. 7º, IX).</li>
              <li><strong>Guardar registros de acesso</strong> — cumprimento de obrigação legal (art. 7º, II; Marco Civil, art. 15).</li>
              <li><strong>Provar que você aceitou estes documentos</strong> — cumprimento de obrigação legal e exercício de direitos (art. 7º, II e VI; art. 8º, §2º).</li>
            </ul>
          ),
        },
        {
          id: "compartilhamento",
          title: "Com quem compartilhamos",
          body: (
            <>
              <p><strong>Não vendemos nem alugamos seus dados.</strong> Usamos fornecedores (operadores) que tratam dados apenas para prestar o serviço:</p>
              <ul>
                <li><strong>Supabase</strong> — autenticação e banco de dados da sua conta;</li>
                <li><strong>Cloudflare</strong> — hospedagem do site, entrega de conteúdo e proteção contra ataques;</li>
                <li><strong>Google e Apple</strong> — somente se você escolher entrar com eles.</li>
              </ul>
              <p>Para mostrar conteúdo, o seu navegador consulta diretamente serviços públicos e abertos, que recebem o seu endereço IP (e, ao usar “Perto de mim”, a posição aproximada da busca):</p>
              <ul>
                <li><strong>OpenStreetMap / Nominatim</strong> — mapa, bibliotecas e busca de cidades;</li>
                <li><strong>Open Library e Internet Archive</strong> — informações, capas e páginas de livros;</li>
                <li><strong>Wikimedia (Wikipédia, Wikisource, Commons)</strong> — fotos e textos de livros em domínio público.</li>
              </ul>
              <p>Esses serviços não recebem seu nome, e-mail ou dados da conta.</p>
            </>
          ),
        },
        {
          id: "internacional",
          title: "Transferência internacional",
          body: (
            <p>
              Alguns fornecedores processam dados em servidores fora do Brasil. Nesses casos, a transferência segue o art. 33 da LGPD, com fornecedores que adotam
              garantias contratuais e padrões de segurança compatíveis com a lei brasileira.
            </p>
          ),
        },
        {
          id: "armazenamento",
          title: "Armazenamento no seu aparelho",
          body: (
            <p>
              Usamos o armazenamento local do navegador/app para manter você conectado e guardar preferências e leituras. <strong>Não usamos cookies de
              rastreamento, ferramentas de análise de terceiros nem publicidade.</strong> Ao sair da conta, os dados da conta são removidos do aparelho.
            </p>
          ),
        },
        {
          id: "retencao",
          title: "Por quanto tempo guardamos",
          body: (
            <ul>
              <li>Dados da conta e de uso: enquanto a conta existir. Ao excluir a conta, eles são apagados na hora do nosso banco; cópias de segurança do fornecedor expiram automaticamente em poucos dias.</li>
              <li>Registros de acesso (IP, data e hora): pelo prazo de retenção dos fornecedores de infraestrutura e, quando aplicável, por 6 meses, como exige o art. 15 do Marco Civil da Internet.</li>
              <li>Registros de consentimento: enquanto a conta existir, para comprovação.</li>
            </ul>
          ),
        },
        {
          id: "direitos",
          title: "Seus direitos",
          body: (
            <>
              <p>A LGPD (art. 18) garante a você:</p>
              <ul>
                <li>confirmar se tratamos seus dados e acessá-los;</li>
                <li>corrigir dados incompletos ou desatualizados;</li>
                <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>portabilidade dos dados;</li>
                <li>eliminação dos dados tratados com consentimento e revogação do consentimento;</li>
                <li>saber com quem compartilhamos seus dados;</li>
                <li>reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
              </ul>
              <p>
                <strong>Você pode fazer isso sozinho, no app:</strong> em{" "}
                <Link to="/app/configuracoes" search={{ aba: "privacidade" }} className="text-primary">Configurações → Privacidade</Link> há os botões
                “Baixar meus dados” e “Excluir minha conta”; o nome é corrigido em Configurações → Conta. Para os demais pedidos, escreva para{" "}
                <a href={`mailto:${CONTROLLER.dpoEmail}`} className="text-primary">{CONTROLLER.dpoEmail}</a>. Respondemos em até 15 dias.
              </p>
            </>
          ),
        },
        {
          id: "criancas",
          title: "Crianças e adolescentes",
          body: (
            <p>
              A Biblioteca Viva tem conteúdo para toda a família. Contas de menores de 12 anos só podem ser criadas com o consentimento específico de pelo menos um
              dos pais ou responsável legal (art. 14 da LGPD), que declara isso no cadastro. Coletamos de crianças apenas o mínimo necessário e sempre no seu melhor
              interesse. Se identificarmos uma conta criada sem essa autorização, ela será excluída.
            </p>
          ),
        },
        {
          id: "seguranca",
          title: "Como protegemos seus dados",
          body: (
            <ul>
              <li>Conexão sempre criptografada (HTTPS).</li>
              <li>Senhas guardadas apenas como hash pelo provedor de autenticação — nem nós conseguimos vê-las.</li>
              <li>Regras de segurança no banco (Row Level Security): cada pessoa só lê e altera os próprios dados.</li>
              <li>Chaves administrativas nunca ficam no app nem no site.</li>
              <li>Em caso de incidente que possa causar risco ou dano relevante, comunicaremos a ANPD e as pessoas afetadas (art. 48).</li>
            </ul>
          ),
        },
        {
          id: "alteracoes",
          title: "Mudanças nesta política",
          body: <p>Quando esta política mudar de forma relevante, publicaremos a nova versão aqui e pediremos um novo aceite na próxima vez que você entrar no app.</p>,
        },
      ]}
    />
  );
}
