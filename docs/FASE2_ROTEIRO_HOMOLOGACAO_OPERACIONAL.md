# Fase 2 — Roteiro de homologação operacional

## Limites obrigatórios
- PR #37 permanece aberto e sem merge até autorização explícita.
- Não aplicar migrações no Supabase de produção.
- Não criar cron de produção nem definir `ENAT_SOCIAL_PUBLISHING_ENABLED=true`.
- Não colar tokens, secrets ou cabeçalhos de autenticação em issues, logs ou chat.
- Primeiro validar com contas e conteúdo de teste, aprovados pelos responsáveis pelas contas.

## Evidências automatizadas
A execução CI #324 passou em `syntax`, `adapter-tests` e `database-tests`. Isso valida sintaxe, tipos/testes simulados e migrações/testes pgTAP no Supabase local isolado. Não comprova autorização de APIs externas, publicação real ou implantação no Render/Supabase.

## Gate do worker
Validar em ambiente isolado, sem credenciais de provedores:
1. `GET` deve retornar 405.
2. `POST` sem `x-cron-secret` ou com valor incorreto deve retornar 401.
3. Com segredo de homologação válido e `ENAT_SOCIAL_PUBLISHING_ENABLED=false`, `POST` deve retornar `status=safe_mode` e `claimed=0`.
4. Com qualquer valor diferente da string exata `true`, o worker deve permanecer em safe mode.
5. `OPTIONS` deve responder ao preflight sem executar a fila.

Os testes unitários do gate cobrem essas condições; o teste HTTP no ambiente hospedado ainda deve ser registrado antes da aprovação operacional.

## Banco e fila
1. Usar somente projeto Supabase de homologação isolado.
2. Aplicar migrations apenas no ambiente isolado e executar pgTAP.
3. Verificar que usuário anônimo/autenticado não consegue reivindicar nem finalizar jobs.
4. Confirmar que jobs só são reivindicados quando a publicação editorial permanece aprovada e o canal está configurado.
5. Simular job antigo em `publishing`: deve terminar em `failed`, sem requeue, com mensagem de reconciliação manual.
6. Simular job recente: deve permanecer intocado.
7. Simular indisponibilidade de finalização: confirmar que o lote não termina abruptamente e que a recuperação posterior não reenvia o conteúdo.

## Provedores sociais — pré-requisitos
Para cada provedor, documentar antes de testar:
- conta/página de homologação e responsável autorizador;
- permissões OAuth exatas e escopos de publicação;
- versão de API suportada;
- URL pública HTTPS de mídia de teste, quando aplicável;
- procedimento para conferir a publicação e removê-la após o teste;
- ID remoto retornado, horário, resultado e logs sem segredos.

### Instagram/Meta
Confirmar que o container chega a `FINISHED` antes de `media_publish`; testar estados `IN_PROGRESS`, `ERROR`, `EXPIRED`, timeout e erro HTTP. Não repetir automaticamente em resultado ambíguo.

### LinkedIn
Confirmar o tipo de token, permissões de escrita, author URN válido e versão REST suportada.

### X
Confirmar OAuth de contexto de usuário com permissão de escrita; bearer de aplicação isolado não é suficiente.

### Facebook
Confirmar token de página e permissões para publicar na página de homologação.

## Critério de aprovação operacional
A fase só pode ser considerada homologada quando:
- CI verde no commit exato a aprovar;
- teste HTTP do gate registrado;
- testes de banco e recuperação aprovados;
- cada provedor validado com conta autorizada, ou formalmente marcado como não homologado;
- nenhum segredo em logs;
- nenhuma publicação duplicada;
- PR revisado e autorização explícita antes de merge/deploy.

Até lá, manter `ENAT_SOCIAL_PUBLISHING_ENABLED` desativada e não configurar agendamento em produção.
