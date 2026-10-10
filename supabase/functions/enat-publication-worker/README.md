# Worker de publicação ENAT — modo seguro

Esta função é apenas um ponto de entrada protegido para preparar a execução no servidor. Ela **não publica**, não reivindica jobs e não faz chamadas a redes sociais enquanto os adaptadores oficiais não forem implementados e homologados.

## Configuração futura
- Definir `ENAT_WORKER_CRON_SECRET` como segredo no Supabase Edge Functions.
- Manter `ENAT_SOCIAL_PUBLISHING_ENABLED=false` até homologação explícita.
- Nunca adicionar tokens ao frontend, ao repositório ou aos logs.
- Implementar e testar adaptadores oficiais de Meta, LinkedIn e X antes de alterar o modo seguro.
- A função retorna `safe_mode` enquanto desativada; mesmo com a flag ativa, retorna 409 sem reivindicar jobs até que adaptadores reais sejam aprovados.
- Só então conectar cron/agenda de servidor à função e validar idempotência, reconciliação de timeouts e retentativas limitadas.

Não implantar nem configurar um cron de produção nesta etapa.
