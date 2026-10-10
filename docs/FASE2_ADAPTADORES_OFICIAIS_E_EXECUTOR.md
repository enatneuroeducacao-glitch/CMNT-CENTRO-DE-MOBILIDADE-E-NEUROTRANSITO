# Adaptadores oficiais de publicação ENAT — implementação segura

## Estado atual
- Adaptadores iniciais de Meta (Facebook/Instagram), LinkedIn e X implementados e testados com respostas simuladas.
- Worker conectado à RPC de claim por canal configurado, revalidação do conteúdo aprovado e RPC de finalização protegida por `claim_token`.
- A feature flag permanece obrigatória (`ENAT_SOCIAL_PUBLISHING_ENABLED=true`) e não foi ativada neste trabalho.
- Nenhuma credencial real foi configurada e nenhuma publicação externa real foi executada. CI #332 aprovado para sintaxe, type-check, testes simulados dos adaptadores e testes de banco isolados. A suíte inclui controle de permissões das RPCs, claim_token incorreto/correto e reivindicação exata de job; isso não substitui homologação real autorizada.

## Canais
- Meta Graph API: Instagram profissional elegível e Facebook Page. Requer configuração de app Meta, permissões aprovadas e tokens adequados. Instagram usa criação de container e posterior publicação; consultar o estado do container antes de confirmar sucesso.
- LinkedIn: API oficial de Posts/UGC conforme versão vigente, com OAuth e escopos adequados ao autor (membro ou organização). Não presumir que qualquer app tem permissão de publicação.
- X: API oficial de posts com OAuth 2.0 ou OAuth 1.0a conforme produto habilitado. Verificar plano, limites e custos antes de ativar.

## Segredos necessários no ambiente de servidor
Todos os nomes abaixo são placeholders de configuração. Não adicionar valores reais ao Git, ao frontend, ao Supabase SQL ou aos logs.
- `ENAT_WORKER_CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (somente Edge Function/server-side)
- Meta: `META_APP_ID`, `META_APP_SECRET`, `META_ACCESS_TOKEN`, identificadores de Page e conta Instagram profissional.
- LinkedIn: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`, identificador do autor.
- X: `X_CLIENT_ID` ou `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` ou refresh token conforme OAuth adotado.
Usar secrets separados entre homologação e produção. Os tokens devem ser provisionados por fluxo oficial OAuth, não enviados ao chat nem commitados.

## Contrato dos adaptadores
Cada adaptador deve aceitar job validado e payload snapshot, e retornar:
- Contrato atual: sucesso retorna `success` e `remotePostId`; falha retorna `success=false`, `retryable` e `safeError`. O timestamp de publicação é definido pela RPC de finalização no banco, não pelo adaptador.
- Confirmar publicação apenas com resposta oficial inequívoca e identificador remoto.
- Sanitizar mensagens e cabeçalhos; jamais persistir tokens, secrets ou resposta bruta com dados sensíveis.
- Não tentar novamente automaticamente em timeout ambíguo até reconciliar com a API.
- Rejeitar payload incompleto, canal não suportado, conteúdo não aprovado ou credenciais ausentes.
- Limitar tamanho/texto e validar mídia conforme os requisitos oficiais de cada plataforma.

## Executor
1. Validar segredo do scheduler; aceitar POST somente.
2. Buscar jobs vencidos de forma atômica via RPC service-role.
3. Revalidar estado editorial aprovado imediatamente antes do envio.
4. Executar adaptador pelo canal e aplicar timeout explícito.
5. Confirmar estado com RPC protegida e `claim_token`; não permitir update arbitrário pelo cliente.
6. Em sucesso: `published`, `remote_post_id`, `published_at`.
7. No estado atual, falhas são finalizadas como `failed`; não há repetição automática nem backoff. Qualquer nova tentativa depende de reconciliação manual para evitar duplicação.
8. Em timeout ambíguo: não re-enfileirar automaticamente; marcar falha de reconciliação para inspeção.
9. Jobs `publishing` antigos são encerrados como `failed` após 15 minutos para reconciliação manual; não são reenfileirados automaticamente. Cancelamento só é garantido antes da reivindicação; após início, a publicação pode estar em curso.
10. Registrar métricas sem tokens ou payloads sensíveis.

## Testes obrigatórios antes de habilitar
- Testes unitários com fetch mockado: sucesso, erro 4xx/5xx, timeout, token expirado, resposta malformada e segredo ausente.
- Testes com ambiente de desenvolvimento/teste oficial de cada plataforma, sem publicar em contas públicas por acidente.
- Verificar permissões e conta elegível por canal.
- Testar corrida de dois workers, token de claim inválido, conteúdo rebaixado, duplicação e falha após envio.
- Executar smoke test por canal com conteúdo explicitamente marcado TESTE, somente após confirmação de ambiente e conta.
- Feature flag fica falsa por padrão. Nunca ativar produção sem aprovação explícita.

## Bloqueadores externos
A implementação final por plataforma depende de credenciais provisionadas pelo proprietário, apps aprovados, permissões, contas elegíveis e, para X, plano/cotas disponíveis. A ausência desses itens deve manter o canal desabilitado, sem impedir a fila de continuar operando.
