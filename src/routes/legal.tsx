import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, FileText, ArrowLeft, ChevronRight, ExternalLink, Lock, Eye, Database, Bell, Users, Globe, Mail, Phone, Scale, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/legal")({
  component: LegalPage,
});

const NAV_ITEMS = [
  { id: "terms", label: "Termos de Uso", icon: FileText },
  { id: "privacy", label: "Política de Privacidade", icon: Shield },
];

const TERMS_SECTIONS = [
  {
    id: "t1",
    title: "1. Aceitação dos Termos",
    content: `Ao acessar, criar uma conta ou utilizar a plataforma EXACTA Smart Project Flow ("Plataforma"), você ("Usuário") declara ter lido, compreendido e concordado integralmente com estes Termos de Uso ("Termos"), bem como com nossa Política de Privacidade.

Se você está aceitando estes Termos em nome de uma organização ou entidade jurídica, você declara ter autoridade para vincular tal entidade a estes Termos. Caso não concorde com qualquer disposição aqui estabelecida, você não está autorizado a acessar ou utilizar a Plataforma.

Estes Termos constituem um acordo legalmente vinculante entre você e a EXACTA Tecnologia Ltda. ("EXACTA", "nós", "nosso" ou "nos"), registrada nos termos da legislação brasileira. A utilização continuada da Plataforma após a publicação de alterações a estes Termos implica na aceitação das modificações realizadas.`,
  },
  {
    id: "t2",
    title: "2. Descrição da Plataforma",
    content: `A EXACTA Smart Project Flow é uma plataforma SaaS (Software as a Service) de gestão empresarial inteligente que oferece as seguintes funcionalidades principais:

• **Gestão de Projetos**: Criação, acompanhamento e exportação de projetos com vinculação entre módulos.
• **Gestão de Tarefas**: Kanban, listas, subtarefas e acompanhamento de progresso automatizado.
• **OKRs e KPIs**: Definição de objetivos, resultados-chave e indicadores de desempenho com cálculo automático de progresso.
• **Cronograma e Gráfico de Gantt**: Planejamento visual de linha do tempo com sincronização automática de datas.
• **Calendário Integrado**: Sincronização automática de atividades, prazos e eventos entre módulos.
• **Documentos e Notas**: Base de conhecimento organizacional vinculada a projetos.
• **Gestão de Equipes**: Convites, papéis, permissões e acompanhamento de desempenho.
• **Inteligência Artificial**: Assistente de produtividade, geração de tarefas e análises com IA.
• **Finanças**: Controle financeiro vinculado a projetos e equipes.
• **Comunicação**: Chat interno, avisos e notificações em tempo real.
• **Análises e Relatórios**: Dashboards, BI e exportação de dossiês completos em PDF e JSON.

A EXACTA reserva-se o direito de modificar, suspender ou descontinuar qualquer funcionalidade da Plataforma a qualquer momento, com ou sem aviso prévio, desde que tal modificação não prejudique direitos adquiridos do Usuário.`,
  },
  {
    id: "t3",
    title: "3. Cadastro e Contas de Usuário",
    content: `3.1 **Elegibilidade**: Para utilizar a Plataforma, você deve ter no mínimo 18 (dezoito) anos de idade ou a maioridade legal em sua jurisdição, e possuir plena capacidade civil para celebrar contratos vinculantes.

3.2 **Informações de Cadastro**: Você concorda em fornecer informações verdadeiras, precisas, atuais e completas durante o processo de registro e em manter tais informações atualizadas. A EXACTA não se responsabiliza por perdas ou danos resultantes de informações incorretas ou desatualizadas fornecidas pelo Usuário.

3.3 **Segurança da Conta**: Você é inteiramente responsável por:
• Manter a confidencialidade de suas credenciais de acesso (e-mail e senha);
• Todas as atividades realizadas em sua conta;
• Notificar imediatamente a EXACTA sobre qualquer uso não autorizado de sua conta através do e-mail: seguranca@exacta.app.

3.4 **Contas Organizacionais**: Quando a Plataforma é utilizada por uma organização, o administrador ("Admin") assume total responsabilidade por: (i) gerenciar os acessos dos usuários; (ii) definir papéis e permissões adequadas; (iii) garantir que todos os usuários da organização cumpram estes Termos; e (iv) proteger as credenciais administrativas.

3.5 **Papéis e Permissões**: A Plataforma adota um sistema de controle de acesso baseado em papéis:
• **Administrador**: Acesso total, gerenciamento de usuários, configurações globais e dados de toda a organização.
• **Gestor**: Criação e gestão de projetos, equipes e relatórios.
• **Colaborador**: Acesso restrito às tarefas e informações de seu escopo de atuação.`,
  },
  {
    id: "t4",
    title: "4. Uso Aceitável",
    content: `4.1 **Condutas Permitidas**: Você pode utilizar a Plataforma para fins lícitos de gestão organizacional, desde que em conformidade com estes Termos e a legislação aplicável.

4.2 **Condutas Proibidas**: É expressamente vedado ao Usuário:
• Utilizar a Plataforma para fins ilegais, fraudulentos ou não autorizados;
• Transmitir conteúdo difamatório, obsceno, abusivo, ameaçador, discriminatório ou que infrinja direitos de terceiros;
• Tentar obter acesso não autorizado a sistemas, contas ou dados de outros usuários;
• Utilizar bots, scripts, scrapers ou qualquer automação não autorizada para acessar a Plataforma;
• Reproduzir, duplicar, copiar, vender, revender ou explorar qualquer parte da Plataforma sem autorização expressa da EXACTA;
• Fazer engenharia reversa, descompilar ou desmontar o software da Plataforma;
• Interferir ou interromper a integridade ou o desempenho da Plataforma;
• Remover avisos de direitos autorais, marcas registradas ou outros avisos de propriedade;
• Utilizar a Plataforma para armazenar ou transmitir malware, vírus ou código malicioso;
• Violar quaisquer leis ou regulamentações aplicáveis, incluindo leis de proteção de dados.

4.3 **Conteúdo do Usuário**: Você é o único responsável por todo o conteúdo que publicar, enviar ou compartilhar através da Plataforma ("Conteúdo do Usuário"). Ao submeter Conteúdo do Usuário, você concede à EXACTA uma licença limitada, não exclusiva e não transferível para processar tal conteúdo exclusivamente com o propósito de fornecer os serviços contratados.`,
  },
  {
    id: "t5",
    title: "5. Propriedade Intelectual",
    content: `5.1 **Propriedade da EXACTA**: A Plataforma, incluindo seu código-fonte, design, interfaces, funcionalidades, textos, imagens, logotipos, marcas registradas e demais elementos, é de propriedade exclusiva da EXACTA e está protegida pelas leis brasileiras e internacionais de propriedade intelectual, incluindo a Lei nº 9.610/1998 (Lei de Direitos Autorais) e a Lei nº 9.279/1996 (Lei da Propriedade Industrial).

5.2 **Licença de Uso**: Sujeito ao cumprimento destes Termos e ao pagamento das taxas aplicáveis, a EXACTA concede ao Usuário uma licença limitada, não exclusiva, não sublicenciável, revogável e intransferível para acessar e utilizar a Plataforma exclusivamente para suas finalidades internas de gestão.

5.3 **Conteúdo do Usuário**: O Usuário mantém todos os direitos de propriedade intelectual sobre o Conteúdo do Usuário que inserir na Plataforma. A EXACTA não reivindica qualquer direito de propriedade sobre o Conteúdo do Usuário.

5.4 **Feedback**: Caso o Usuário forneça sugestões, ideias, melhorias ou feedback ("Feedback") sobre a Plataforma, a EXACTA poderá utilizar tal Feedback livremente, sem qualquer obrigação de compensação, atribuição ou confidencialidade.`,
  },
  {
    id: "t6",
    title: "6. Planos, Preços e Pagamentos",
    content: `6.1 **Planos de Serviço**: A EXACTA oferece diferentes planos de serviço (gratuito e pagos), com funcionalidades e limites distintos conforme detalhado na página de preços da Plataforma.

6.2 **Cobranças**: Os planos pagos são cobrados antecipadamente na periodicidade contratada (mensal ou anual). Todas as taxas são expressas em Reais (BRL) e são acrescidas dos impostos aplicáveis.

6.3 **Política de Reembolso**: Salvo disposição legal em contrário ou acordo específico por escrito:
• Para planos mensais: não há reembolso por períodos parciais utilizados;
• Para planos anuais: reembolso proporcional pelo período não utilizado, deduzidas taxas administrativas, disponível em até 30 (trinta) dias após a contratação;
• O direito de arrependimento previsto no Código de Defesa do Consumidor (Art. 49, Lei 8.078/1990) para contratos celebrados à distância aplica-se integralmente.

6.4 **Cancelamento**: O cancelamento da assinatura pode ser realizado a qualquer momento através das Configurações da conta. O acesso às funcionalidades pagas permanecerá disponível até o término do período já pago.

6.5 **Inadimplência**: Em caso de falha no pagamento, a EXACTA poderá suspender ou cancelar o acesso às funcionalidades pagas, após notificação ao Usuário.`,
  },
  {
    id: "t7",
    title: "7. Disponibilidade e SLA",
    content: `7.1 **Disponibilidade**: A EXACTA envidará esforços razoáveis para manter a Plataforma disponível 24 (vinte e quatro) horas por dia, 7 (sete) dias por semana. No entanto, a EXACTA não garante disponibilidade ininterrupta e não se responsabiliza por indisponibilidades decorrentes de:
• Manutenção programada (com aviso prévio de 24h sempre que possível);
• Falhas de infraestrutura de terceiros (provedores de nuvem, telecomunicações);
• Ataques cibernéticos ou eventos de força maior;
• Ações do próprio Usuário.

7.2 **Backup**: A EXACTA realiza backups regulares dos dados armazenados na Plataforma. Contudo, o Usuário é responsável por manter suas próprias cópias de segurança de dados críticos. A funcionalidade de exportação de dossiês e pacotes JSON da Plataforma pode ser utilizada para este fim.

7.3 **Manutenção**: Atualizações e manutenções que possam causar interrupção serão realizadas preferencialmente em períodos de baixo uso e com comunicação prévia aos usuários.`,
  },
  {
    id: "t8",
    title: "8. Limitação de Responsabilidade",
    content: `8.1 **Isenção de Garantias**: A PLATAFORMA É FORNECIDA "NO ESTADO EM QUE SE ENCONTRA" E "CONFORME DISPONÍVEL". A EXACTA NÃO OFERECE GARANTIAS, EXPRESSAS OU IMPLÍCITAS, INCLUINDO, MAS NÃO SE LIMITANDO A, GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UMA FINALIDADE ESPECÍFICA OU NÃO VIOLAÇÃO DE DIREITOS.

8.2 **Limitação de Danos**: Na máxima extensão permitida pela legislação aplicável, a EXACTA não será responsável por:
• Danos indiretos, incidentais, especiais, consequenciais ou punitivos;
• Perda de lucros, receitas, dados, boa vontade ou outras perdas intangíveis;
• Danos resultantes do uso ou impossibilidade de uso da Plataforma;
• Condutas de terceiros na Plataforma.

8.3 **Limite Máximo de Responsabilidade**: A responsabilidade total da EXACTA perante o Usuário, por qualquer causa e independentemente da teoria da responsabilidade, será limitada ao valor pago pelo Usuário à EXACTA nos 12 (doze) meses anteriores ao evento que originou a reclamação, ou R$ 500,00 (quinhentos reais), o que for maior.

8.4 **Exceções**: Nada nestes Termos excluirá ou limitará a responsabilidade da EXACTA por morte ou lesão corporal causada por negligência, fraude ou deturpação fraudulenta, ou qualquer outra responsabilidade que não possa ser excluída ou limitada pela lei aplicável.`,
  },
  {
    id: "t9",
    title: "9. Vigência e Rescisão",
    content: `9.1 **Vigência**: Estes Termos entram em vigor na data de aceitação pelo Usuário e permanecem em vigor enquanto o Usuário mantiver uma conta ativa na Plataforma.

9.2 **Rescisão pelo Usuário**: O Usuário pode encerrar sua conta a qualquer momento através das Configurações da Plataforma ou enviando solicitação para suporte@exacta.app.

9.3 **Rescisão pela EXACTA**: A EXACTA pode suspender ou encerrar o acesso do Usuário à Plataforma imediatamente, com ou sem aviso prévio, caso:
• O Usuário viole quaisquer disposições destes Termos;
• A EXACTA seja obrigada a fazê-lo por lei ou ordem judicial;
• O Usuário adote conduta que cause danos à EXACTA, outros usuários ou terceiros.

9.4 **Efeitos da Rescisão**: Após o encerramento da conta:
• O acesso à Plataforma será imediatamente revogado;
• Os dados do Usuário serão retidos por 90 (noventa) dias para possibilitar a recuperação e exportação;
• Após 90 dias, os dados serão permanentemente deletados, salvo obrigação legal de retenção;
• As cláusulas que por sua natureza devam sobreviver à rescisão (incluindo propriedade intelectual, limitação de responsabilidade e foro) permanecerão em vigor.`,
  },
  {
    id: "t10",
    title: "10. Disposições Gerais",
    content: `10.1 **Lei Aplicável**: Estes Termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil, em especial o Código Civil Brasileiro (Lei nº 10.406/2002), o Código de Defesa do Consumidor (Lei nº 8.078/1990), o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

10.2 **Foro**: As partes elegem o foro da Comarca de [Cidade/Estado da EXACTA], com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir quaisquer controvérsias decorrentes destes Termos.

10.3 **Alterações**: A EXACTA pode modificar estes Termos periodicamente. Alterações materiais serão comunicadas com pelo menos 30 (trinta) dias de antecedência por e-mail ou através de notificação na Plataforma. O uso continuado após a vigência das alterações constitui aceitação dos novos Termos.

10.4 **Integralidade**: Estes Termos, juntamente com a Política de Privacidade e quaisquer acordos específicos celebrados, constituem o acordo integral entre o Usuário e a EXACTA com relação ao uso da Plataforma.

10.5 **Separabilidade**: Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito.

10.6 **Contato**: Para dúvidas sobre estes Termos, entre em contato através de: juridico@exacta.app

**Última atualização**: 11 de setembro de 2026
**Versão**: 1.0`,
  },
];

const PRIVACY_SECTIONS = [
  {
    id: "p1",
    title: "1. Introdução e Controlador de Dados",
    icon: Shield,
    content: `A EXACTA Tecnologia Ltda. ("EXACTA", "nós", "nos" ou "nosso"), como Controladora de Dados nos termos da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 – "LGPD"), compromete-se a proteger a privacidade e os dados pessoais de todos os usuários da plataforma EXACTA Smart Project Flow.

Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações pessoais. Ela se aplica a todos os usuários da Plataforma e deve ser lida em conjunto com nossos Termos de Uso.

**Encarregado de Proteção de Dados (DPO)**
Em conformidade com o Art. 41 da LGPD, nosso Encarregado de Proteção de Dados pode ser contatado através de:
• E-mail: dpo@exacta.app
• Endereço: [Endereço completo da EXACTA]`,
  },
  {
    id: "p2",
    title: "2. Dados que Coletamos",
    icon: Database,
    content: `Coletamos diferentes categorias de dados pessoais para fornecer e melhorar a Plataforma:

**2.1 Dados Fornecidos Diretamente por Você:**
• **Dados de Cadastro**: Nome completo, endereço de e-mail, senha (armazenada em formato hash criptografado), cargo/função profissional, foto de perfil (opcional).
• **Dados Organizacionais**: Nome da empresa, departamento, tamanho da equipe.
• **Conteúdo Criado**: Projetos, tarefas, documentos, notas, mensagens de chat, comentários e demais dados inseridos na Plataforma.
• **Dados de Pagamento**: Dados de cobrança (processados por gateways de pagamento certificados PCI-DSS; não armazenamos dados completos de cartão de crédito).

**2.2 Dados Coletados Automaticamente:**
• **Dados de Uso**: Funcionalidades acessadas, frequência de uso, preferências de configuração, idioma.
• **Dados Técnicos**: Endereço IP, tipo e versão do navegador, sistema operacional, identificadores de dispositivo, fuso horário.
• **Logs de Acesso**: Registros de acesso à Plataforma, conforme exigido pelo Art. 15 do Marco Civil da Internet.
• **Cookies e Tecnologias Similares**: Detalhados na Seção 8 desta Política.

**2.3 Dados Recebidos de Terceiros:**
• Dados de autenticação de provedores de login social (Google, Microsoft), caso o Usuário opte por essa modalidade.
• Dados de integrações com ferramentas de terceiros ativadas pelo Usuário.`,
  },
  {
    id: "p3",
    title: "3. Finalidades e Bases Legais do Tratamento",
    icon: Scale,
    content: `Tratamos seus dados pessoais com base nas seguintes finalidades e fundamentos legais previstos no Art. 7º da LGPD:

| Finalidade | Base Legal (LGPD) |
|---|---|
| Prestação dos serviços contratados | Execução de contrato (Art. 7º, V) |
| Autenticação e controle de acesso | Execução de contrato (Art. 7º, V) |
| Comunicações sobre a conta e serviços | Execução de contrato (Art. 7º, V) |
| Cobrança e gestão financeira | Execução de contrato (Art. 7º, V) |
| Suporte ao cliente | Execução de contrato (Art. 7º, V) |
| Melhoria da Plataforma e análises internas | Legítimo interesse (Art. 7º, IX) |
| Prevenção a fraudes e segurança | Legítimo interesse (Art. 7º, IX) |
| Cumprimento de obrigações legais | Obrigação legal (Art. 7º, II) |
| Comunicações de marketing (com opt-in) | Consentimento (Art. 7º, I) |
| Funcionalidades de IA e sugestões | Consentimento (Art. 7º, I) |

Para o tratamento de dados baseado em consentimento, você pode retirar seu consentimento a qualquer momento através das Configurações da conta, sem prejuízo da licitude do tratamento realizado anteriormente.`,
  },
  {
    id: "p4",
    title: "4. Compartilhamento de Dados",
    icon: Users,
    content: `A EXACTA não vende, aluga ou comercializa seus dados pessoais. Compartilhamos seus dados apenas nas seguintes situações:

**4.1 Com Prestadores de Serviço (Operadores de Dados):**
Contratamos empresas terceiras para nos auxiliar na operação da Plataforma, mediante contratos que garantem proteção adequada aos seus dados:
• **Supabase**: Banco de dados e autenticação (hospedagem em servidores com certificação SOC 2).
• **Cloudflare**: Infraestrutura de rede e segurança (proteção DDoS, CDN).
• **Provedores de IA** (Google Gemini, Groq): Processamento de funcionalidades de inteligência artificial, mediante anonimização sempre que possível.
• **Gateways de Pagamento**: Processamento de pagamentos com conformidade PCI-DSS.
• **Serviços de E-mail**: Envio de notificações e comunicações transacionais.

**4.2 Com Outros Usuários da Sua Organização:**
Em ambientes de equipe, informações como nome, foto de perfil, cargo e atividades relacionadas a projetos compartilhados são visíveis para outros membros da sua organização, conforme configurado pelo Administrador.

**4.3 Por Obrigação Legal:**
Podemos divulgar dados quando exigido por lei, ordem judicial, autoridade regulatória competente ou para exercício regular de direitos em processo judicial, administrativo ou arbitral.

**4.4 Em Operações Corporativas:**
Em caso de fusão, aquisição ou venda de ativos, seus dados podem ser transferidos ao adquirente, que deverá respeitar os termos desta Política.

**4.5 Transferência Internacional de Dados:**
Alguns de nossos prestadores de serviço podem estar localizados fora do Brasil. Nesse caso, garantimos que a transferência internacional de dados seja realizada com as salvaguardas adequadas previstas nos Arts. 33 a 36 da LGPD.`,
  },
  {
    id: "p5",
    title: "5. Seus Direitos como Titular de Dados",
    icon: CheckCircle2,
    content: `Nos termos dos Arts. 17 a 22 da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais, que podem ser exercidos através das Configurações da conta ou pelo e-mail privacidade@exacta.app:

**• Direito de Confirmação e Acesso (Art. 18, I e II):**
Confirmar a existência de tratamento e obter acesso aos seus dados pessoais tratados pela EXACTA.

**• Direito de Correção (Art. 18, III):**
Solicitar a correção de dados incompletos, inexatos ou desatualizados.

**• Direito de Anonimização, Bloqueio ou Eliminação (Art. 18, IV):**
Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.

**• Direito de Portabilidade (Art. 18, V):**
Solicitar a portabilidade dos seus dados a outro fornecedor de serviço, mediante requisição expressa, em formato estruturado e interoperável (JSON ou CSV).

**• Direito de Eliminação com Revogação de Consentimento (Art. 18, VI):**
Solicitar a eliminação dos dados tratados com base no seu consentimento, após sua revogação.

**• Direito à Informação sobre Compartilhamento (Art. 18, VII):**
Obter informações sobre as entidades com as quais seus dados são compartilhados.

**• Direito de Oposição (Art. 18, § 2º):**
Opor-se ao tratamento de dados realizado com base em legítimo interesse, quando tal tratamento violar seus direitos.

**• Direito de Revisão de Decisão Automatizada (Art. 20):**
Solicitar revisão de decisões tomadas exclusivamente com base em tratamento automatizado de dados.

**Prazos de Atendimento:** Respondemos às solicitações em até 15 (quinze) dias úteis. Podemos solicitar verificação de identidade antes de atender às solicitações.`,
  },
  {
    id: "p6",
    title: "6. Retenção e Exclusão de Dados",
    icon: Database,
    content: `**6.1 Períodos de Retenção:**
Retemos seus dados pessoais pelo tempo necessário para as finalidades para as quais foram coletados, observando os seguintes critérios:

• **Dados de conta ativa**: Enquanto a conta estiver ativa ou conforme necessário para prestação dos serviços.
• **Dados após encerramento da conta**: 90 (noventa) dias para possibilitar recuperação de dados; após esse prazo, exclusão definitiva.
• **Logs de acesso**: 6 (seis) meses, conforme exigido pelo Art. 15 do Marco Civil da Internet.
• **Dados financeiros e de cobrança**: 5 (cinco) anos, conforme exigência fiscal e contábil.
• **Dados para defesa em processo judicial**: Pelo prazo prescricional aplicável.

**6.2 Processo de Exclusão:**
Ao solicitar a exclusão da conta, seus dados são marcados para exclusão e permanentemente removidos após o período de retenção aplicável. Dados que sejam necessários para cumprimento de obrigação legal ou exercício de direitos em processo serão retidos pelo prazo estritamente necessário.

**6.3 Dados Anonimizados:**
Podemos reter dados estatísticos e agregados, completamente anonimizados, que não permitam a identificação individual, por período indefinido para fins de análise e melhoria da Plataforma.`,
  },
  {
    id: "p7",
    title: "7. Segurança dos Dados",
    icon: Lock,
    content: `A EXACTA adota medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, perda, destruição, alteração ou divulgação indevida:

**Medidas Técnicas:**
• **Criptografia em trânsito**: Todas as comunicações utilizam TLS 1.3 (HTTPS).
• **Criptografia em repouso**: Dados armazenados com criptografia AES-256.
• **Senhas**: Armazenadas exclusivamente em formato hash com salt (bcrypt/Argon2).
• **Autenticação**: Suporte a autenticação multifator (MFA).
• **Row Level Security (RLS)**: Isolamento de dados por organização no banco de dados.
• **Monitoramento**: Sistemas de detecção de intrusão e monitoramento 24/7.
• **Backups**: Backups criptografados realizados diariamente com retenção de 30 dias.

**Medidas Organizacionais:**
• Acesso restrito aos dados pessoais com base no princípio do menor privilégio.
• Treinamento regular de colaboradores em segurança da informação e proteção de dados.
• Políticas internas de segurança e privacidade desde a concepção (Privacy by Design).
• Processos documentados de resposta a incidentes.

**Notificação de Incidentes:**
Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a EXACTA comunicará a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados em prazo razoável, nos termos do Art. 48 da LGPD.

Nenhum sistema é 100% seguro. O Usuário também é responsável por manter a segurança de suas credenciais de acesso.`,
  },
  {
    id: "p8",
    title: "8. Cookies e Tecnologias de Rastreamento",
    icon: Eye,
    content: `**8.1 O que são Cookies:**
Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa a Plataforma. Utilizamos cookies e tecnologias similares para garantir o funcionamento adequado da Plataforma e melhorar sua experiência.

**8.2 Tipos de Cookies que Utilizamos:**

**Cookies Estritamente Necessários** (sempre ativos):
• Autenticação e manutenção de sessão segura.
• Preferências de acessibilidade e idioma.
• Tokens de segurança (CSRF protection).

**Cookies Funcionais** (com consentimento):
• Preferências de interface (tema claro/escuro, layout).
• Configurações personalizadas de exibição.

**Cookies Analíticos** (com consentimento):
• Análise de uso e desempenho da Plataforma para fins de melhoria.
• Identificação de funcionalidades com problemas.

**8.3 Gerenciamento de Cookies:**
Você pode gerenciar as preferências de cookies através:
• Das configurações do seu navegador (desativar cookies pode afetar o funcionamento da Plataforma).
• Do painel de configurações de privacidade disponível nas Configurações da conta.

**8.4 Não Rastreamento (Do Not Track):**
A Plataforma respeita sinais de "Do Not Track" para cookies de rastreamento analítico de terceiros.`,
  },
  {
    id: "p9",
    title: "9. Inteligência Artificial e Dados",
    icon: Globe,
    content: `A Plataforma integra funcionalidades de Inteligência Artificial (IA) para melhorar a produtividade dos usuários. Informamos de forma transparente como seus dados são tratados nestas funcionalidades:

**9.1 Funcionalidades de IA:**
• Assistente de produtividade e chat com IA.
• Geração automática de tarefas e estruturas de projeto.
• Análise de gargalos e insights de desempenho.
• Brainstorming e geração de conteúdo.

**9.2 Provedores de IA:**
Utilizamos APIs de provedores terceiros de IA (atualmente Google Gemini e Groq). Ao utilizar funcionalidades de IA, o conteúdo das suas consultas pode ser processado por esses provedores, sujeito às políticas de privacidade e termos de uso desses provedores.

**9.3 Minimização de Dados:**
Adotamos práticas de minimização de dados ao interagir com APIs de IA:
• Não incluímos dados pessoais desnecessários nas consultas de IA.
• As respostas de IA não são utilizadas para treinar modelos de IA externos sem seu consentimento explícito.
• Você pode optar por não utilizar funcionalidades de IA nas Configurações da conta.

**9.4 Decisões Automatizadas:**
Decisões com efeito legal significativo não são tomadas exclusivamente por sistemas automatizados. Você tem o direito de solicitar revisão humana de decisões automatizadas, nos termos do Art. 20 da LGPD.`,
  },
  {
    id: "p10",
    title: "10. Alterações e Contato",
    icon: Bell,
    content: `**10.1 Alterações nesta Política:**
Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas práticas, na legislação aplicável ou no funcionamento da Plataforma.

Alterações materiais serão comunicadas com pelo menos 30 (trinta) dias de antecedência através de:
• E-mail para o endereço cadastrado na conta.
• Notificação em destaque na Plataforma.

O uso continuado da Plataforma após a vigência das alterações constituirá aceitação da Política atualizada. Se você não concordar com as alterações, poderá encerrar sua conta nos termos da Seção 9 dos Termos de Uso.

**10.2 Autoridade de Supervisão:**
Se você acredita que o tratamento de seus dados pessoais viola a LGPD, você tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD):
• Website: www.gov.br/anpd
• E-mail: comunicacao@anpd.gov.br

**10.3 Canais de Contato:**
Para exercer seus direitos ou esclarecer dúvidas sobre esta Política, entre em contato conosco:

• **Encarregado de Proteção de Dados (DPO)**: dpo@exacta.app
• **Privacidade Geral**: privacidade@exacta.app
• **Segurança**: seguranca@exacta.app
• **Suporte**: suporte@exacta.app

**Última atualização**: 11 de setembro de 2026
**Versão**: 1.0

Esta Política de Privacidade foi elaborada em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e demais regulamentações aplicáveis.`,
  },
];

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [activeSection, setActiveSection] = useState<string>("t1");

  const sections = activeTab === "terms" ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao sistema</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">EXACTA · Documentos Legais</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Scale className="h-3.5 w-3.5" />
            Documentos Jurídicos Oficiais
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Transparência & Conformidade Legal
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Nossos documentos legais são redigidos de forma clara e acessível. Valorizamos sua privacidade e nos comprometemos com a conformidade com a LGPD e demais regulamentações aplicáveis.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Conformidade LGPD</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Marco Civil da Internet</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Proteção ao Consumidor (CDC)</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Criptografia de Dados</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit mx-auto mb-10">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as "terms" | "privacy");
                  setActiveSection(item.id === "terms" ? "t1" : "p1");
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-8 items-start">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24">
            <div className="bg-card border border-border rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                {activeTab === "terms" ? "Termos de Uso" : "Política de Privacidade"}
              </p>
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <ChevronRight className={`h-3 w-3 flex-shrink-0 transition-transform ${isActive ? "rotate-90 text-primary" : ""}`} />
                    <span className="line-clamp-2 leading-tight">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Document Header */}
              <div className={`px-8 py-6 border-b border-border ${
                activeTab === "terms"
                  ? "bg-gradient-to-r from-blue-950/40 to-indigo-950/30"
                  : "bg-gradient-to-r from-emerald-950/40 to-teal-950/30"
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {activeTab === "terms"
                    ? <FileText className="h-5 w-5 text-blue-400" />
                    : <Shield className="h-5 w-5 text-emerald-400" />
                  }
                  <h2 className="font-bold text-xl">
                    {activeTab === "terms" ? "Termos de Uso" : "Política de Privacidade"}
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  {activeTab === "terms"
                    ? "EXACTA Smart Project Flow · Versão 1.0 · Última atualização: 11 de setembro de 2026"
                    : "EXACTA Smart Project Flow · Versão 1.0 · Em conformidade com a LGPD (Lei nº 13.709/2018)"
                  }
                </p>
              </div>

              {/* Sections */}
              <div className="p-8 space-y-10">
                {sections.map((section) => {
                  const Icon = (section as any).icon;
                  return (
                    <section
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {Icon && (
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
                      </div>
                      <div className="pl-0 lg:pl-11">
                        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                          {section.content.split("\n\n").map((para, i) => {
                            if (para.startsWith("| ")) {
                              // Render table
                              const rows = para.split("\n").filter((r) => r.startsWith("|"));
                              return (
                                <div key={i} className="overflow-x-auto my-4">
                                  <table className="w-full text-xs border-collapse">
                                    {rows.map((row, ri) => {
                                      const cells = row.split("|").filter(Boolean);
                                      if (ri === 1) return null; // separator row
                                      const isHeader = ri === 0;
                                      return (
                                        <tr key={ri} className={isHeader ? "bg-muted/50" : "border-t border-border"}>
                                          {cells.map((cell, ci) => (
                                            isHeader
                                              ? <th key={ci} className="px-3 py-2 text-left font-semibold text-foreground">{cell.trim()}</th>
                                              : <td key={ci} className="px-3 py-2">{cell.trim()}</td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </table>
                                </div>
                              );
                            }

                            return (
                              <p key={i} className="mb-3 last:mb-0">
                                {para.split(/(\*\*[^*]+\*\*)/).map((part, pi) => {
                                  if (part.startsWith("**") && part.endsWith("**")) {
                                    return <strong key={pi} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                                  }
                                  if (part.startsWith("• ")) {
                                    return (
                                      <span key={pi} className="flex items-start gap-2 my-1">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{part.slice(2)}</span>
                                      </span>
                                    );
                                  }
                                  return part;
                                })}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                      <div className="h-px bg-border mt-8" />
                    </section>
                  );
                })}
              </div>
            </div>

            {/* Contact Box */}
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {[
                { icon: Mail, label: "Privacidade", email: "privacidade@exacta.app", color: "text-blue-400" },
                { icon: Shield, label: "DPO / LGPD", email: "dpo@exacta.app", color: "text-emerald-400" },
                { icon: AlertTriangle, label: "Segurança", email: "seguranca@exacta.app", color: "text-amber-400" },
              ].map((contact) => {
                const Icon = contact.icon;
                return (
                  <div key={contact.email} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-4 w-4 ${contact.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{contact.label}</p>
                      <a href={`mailto:${contact.email}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                        {contact.email}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground mt-8 pb-4">
              © 2026 EXACTA Tecnologia Ltda. · Todos os direitos reservados · CNPJ: XX.XXX.XXX/0001-XX
              <br />
              Este documento foi elaborado em conformidade com a LGPD (Lei 13.709/2018), Marco Civil da Internet (Lei 12.965/2014) e CDC (Lei 8.078/1990).
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
