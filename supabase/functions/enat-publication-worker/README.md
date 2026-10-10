# Worker de publicação ENAT — execução protegida

## Estado atual
O worker está conectado à fila Supabase e aos adaptadores iniciais de Meta, LinkedIn e X. Ele só reivindica jobs de canais com configuração mínima, revalida se o conteúdo continua aprovado imediatamente antes de enviar e finaliza a fila com RPC protegida por `claim_token`.

**A publicação permanece desativada por padrão.** Não ativar `ENAT_SOCIAL_PUBLISHING_ENABLED=true` nem configurar cron de produção até que as credenciais e permissões sejam verificadas e a homologação real seja autorizada.

## Segredos do servidor
Configurar apenas no ambiente seguro da Edge Function; nunca no frontend, Git, SQL ou conversa:
- `ENAT_WORKER_CRON_SECRET`
- `ENAT_SOCIAL_PUBLISHING_ENABLED=false` até autorização explícita
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Meta: `META_ACCESS_TOKEN`, `META_GRAPH_API_VERSION`, `META_PAGE_ID`, `META_INSTAGRAM_USER_ID` conforme o canal
- LinkedIn: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_API_VERSION`, `LINKEDIN_AUTHOR_URN`
- X: `X_USER_ACCESS_TOKEN` — token OAuth em contexto de usuário com permissão de escrita; não usar token app-only.

Somente canais com credenciais mínimas completas são reivindicados. Para Instagram, o agendamento exige URL HTTPS pública de imagem em `payload_snapshot.media_url`. A URL deve ser acessível pelos servidores da Meta.

## Execução e segurança
- Aceita apenas POST com `x-cron-secret` correto.
- Não executa nada enquanto a feature flag estiver desativada.
- A RPC de claim seleciona apenas canais configurados, jobs vencidos e conteúdos aprovados, usando bloqueio concorrente.
- Antes de cada envio, consulta novamente o estado editorial.
- A RPC de finalização exige o token de claim atual e só aceita `published` ou `failed`.
- Resultado ambíguo de rede não é reenfileirado automaticamente; exige reconciliação manual para evitar publicação duplicada.
- Não registra tokens nem respostas brutas de APIs.
- A fila atual não implementa backoff automático nem reconciliação automática com as redes.

## Limitações que bloqueiam produção
- Os testes atuais usam respostas simuladas; não provam permissões reais, elegibilidade de conta ou publicação real.
- O adaptador do Instagram agora consulta o estado do container antes de `media_publish`, com espera limitada a 60 segundos; a integração ainda precisa de homologação real autorizada.
- Antes de reivindicar novos jobs, o worker encerra jobs presos em `publishing` há pelo menos 15 minutos como `failed`, limpa o token de claim e exige reconciliação manual; isso não reenfileira nem repete publicações. A RPC e o fluxo precisam passar no CI atualizado.
- Não há tokens provisionados neste repositório e nenhum envio real foi executado.

Antes de ativar, executar o CI atualizado, revisar as permissões oficiais de cada app e realizar smoke tests com contas de homologação autorizadas.
