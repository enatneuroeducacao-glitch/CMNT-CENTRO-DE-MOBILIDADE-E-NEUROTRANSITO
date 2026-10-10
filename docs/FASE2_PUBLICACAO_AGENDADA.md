# Fase 2 — Publicação agendada ENAT

## Objetivo
Construir uma fila confiável de publicação agendada, mantendo a aprovação editorial como requisito obrigatório. A primeira entrega cobre o modelo de dados e os controles; não publica em redes sociais sem credenciais oficiais e integração homologada.

## Escopo incremental
1. Fila de publicações com canal, data/hora e fuso explícito.
2. Só conteúdo com status `approved` pode ser enfileirado ou colocado em processamento.
3. Estados: `queued`, `publishing`, `published`, `failed`, `cancelled`.
4. Rastreabilidade: criador, última atualização, tentativas, identificador remoto, horário de publicação e erro.
5. RLS baseada no cadastro administrativo CMNT/ENAT existente.
6. Integração com APIs oficiais e agendador somente após credenciais configuradas e testes de homologação.

## Guardrails
- Não aplicar migrations da Fase 2 no Supabase ativo durante o desenvolvimento.
- Não publicar conteúdo automaticamente nesta etapa.
- Não colocar tokens de redes sociais no frontend, Git ou logs.
- Não declarar publicação concluída apenas porque um job foi enfileirado.
- Antes de ativar execução automática, validar idempotência, retentativas, cancelamento, limites das APIs e logs sem dados sensíveis.

## Critérios de aceite
- Apenas administradores autorizados acessam a fila.
- Não é possível enfileirar conteúdo não aprovado.
- Data/hora é armazenada como `timestamptz` com fuso declarado.
- Falhas são visíveis e podem ser retentadas sem duplicar postagem.
- Cancelamento impede novos envios se o job ainda não foi iniciado.
- Testes de integração usam ambiente isolado e nunca publicam em contas reais.
