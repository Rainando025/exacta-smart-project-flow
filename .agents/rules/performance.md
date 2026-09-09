# Performance, Egress & Optimization Rules

Ao desenvolver ou modificar este projeto, siga estritamente as seguintes regras de performance, resposta instantânea e otimização de banda/egress:

1. **🎯 SELEÇÃO EXPLÍCITA DE COLUNAS (NUNCA USAR SELECT \*)**:
   - Jamais faça consultas buscando todas as colunas (`select('*')`).
   - Especifique estritamente apenas as colunas necessárias para a tela/componente atual (Ex: `select('id, name, status, created_at')`).
   - Em tabelas com dezenas de campos ou colunas pesadas (JSON, imagens, textos longos), selecione os campos pesados apenas na tela de detalhe/edição.

2. **📄 PAGINAÇÃO OBRIGATÓRIA NO SERVIDOR (SERVER-SIDE PAGINATION)**:
   - Nunca carregue listas inteiras de dados de uma só vez na memória do cliente.
   - Toda listagem (tabelas, cards, relatórios) DEVE ter limitação no servidor usando paginação (Ex: `.range(from, to)` no Supabase com limite de 10 a 25 itens por página).
   - Dê preferência ao padrão de Paginação Clássica com botões "Anterior / Próximo" para previsibilidade de carga.

3. **🧠 GERENCIAMENTO DE ESTADO E CACHE GLOBAL (TANSTACK QUERY / SWR)**:
   - Todas as requisições de busca (queries) DEVEM ser envelopadas por TanStack Query (React Query) ou SWR.
   - Configure um `staleTime` mínimo de 2 a 5 minutos (`staleTime: 1000 * 60 * 2`) para evitar re-fetches automáticos a cada troca de aba ou re-renderização de componente.
   - Desative re-fetch desnecessários no foco da janela (`refetchOnWindowFocus: false`).

4. **🖼️ OTIMIZAÇÃO DE ASSETS E STORAGE**:
   - Toda imagem ou anexo enviado pelo usuário DEVE passar por compressão no cliente antes do upload (WebP/JPEG otimizado, largura máxima de 1200px).
   - Configure cabeçalhos de cache de longa duração no provedor de hospedagem (Vercel/Netlify): `Cache-Control: public, max-age=31536000, immutable` para arquivos estáticos (JS, CSS, SVGs, fontes).

5. **⚡ CODE-SPLITTING E BUNDLE SIZE**:
   - Utilize dynamic imports (`React.lazy` / `import()`) para componentes pesados, modais e páginas de relatórios complexos, mantendo o bundle inicial pequeno.
   - Monitore a importação de bibliotecas para evitar inclusão de pacotes desnecessários.

6. **🔒 REGRAS DE BANCO DE DADOS E ÍNDICES**:
   - Certifique-se de que todas as colunas utilizadas em `WHERE`, `ORDER BY` e Chaves Estrangeiras (`FOREIGN KEY`) possuam índices no banco de dados.
