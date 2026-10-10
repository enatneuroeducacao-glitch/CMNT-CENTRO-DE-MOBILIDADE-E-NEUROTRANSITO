# Fase 2 — Contrato seguro de integração com redes sociais

## Estado desta entrega
Este documento prepara a arquitetura. Nenhuma conta social foi conectada e nenhum token foi criado. A fila atual registra agendamentos, mas não envia publicações externas.

## Arquitetura obrigatória
1. Interface editorial autenticada cria e acompanha jobs usando a sessão Supabase e RLS.
2. Um executor de servidor separado reivindica jobs vencidos de forma atômica; o navegador nunca executa publicação agendada.
3. Adaptadores de plataforma recebem somente o payload aprovado e credenciais lidas de um gestor de segredos/variáveis protegidas do servidor.
4. O executor registra tentativa, resultado, ID remoto, timestamp e erro sanitizado.
5. A conclusão só pode ser marcada como `published` após confirmação da API oficial. Uma resposta incerta fica em estado de reconciliação, nunca gera retry cego.

## Adaptadores e pré-requisitos
- **Instagram/Facebook (Meta):** usar APIs oficiais de publicação, conta profissional compatível, Página vinculada quando exigido, permissões concedidas e tokens com validade/renovação monitoradas.
- **LinkedIn:** usar API oficial de compartilhamento/publicação, escopos e autorização adequados ao tipo de autor (membro ou organização).
- **X:** usar API oficial e credenciais aprovadas para o nível de acesso da conta/projeto; confirmar limites e custos antes de ativar.
- Não automatizar por navegador, scraping, senha da conta, endpoints não documentados ou serviços que peçam a senha social.

## Segredos e dados
- Tokens e client secrets somente no ambiente de servidor (Render), nunca em `editorial.js`, HTML, localStorage, logs, issues ou commits.
- A chave Supabase publicável no frontend não é segredo; a chave `service_role` nunca pode ser enviada ao cliente.
- Guardar apenas os metadados necessários; nunca registrar tokens completos. Sanitizar respostas de erro antes de persistir.
- Definir URL de callback OAuth HTTPS, validar `state`, solicitar escopos mínimos e planejar revogação/rotação.
- Separar credenciais de homologação e produção.

## Idempotência, tentativas e reconciliação
- A fila limita a uma publicação ativa/concluída por conteúdo e canal; a restrição também existe no banco.
- O executor deve reivindicar jobs com lock/transição atômica, definir timeout e heartbeat e impedir dois workers de enviar o mesmo job.
- Retry automático somente para falhas transitórias confirmadas e com backoff limitado. Erros de permissão, conteúdo inválido ou quota exigem ação administrativa.
- Se houver timeout depois de enviar à plataforma e não for possível saber se ela publicou, consultar a API por identificador/correlação antes de tentar novamente.
- Cancelamento é válido apenas enquanto `queued`. Depois de iniciado, deve mostrar que o envio pode já estar em andamento.
- Registrar `attempt_count`, `last_error`, `remote_post_id`, `published_at` e transições de estado sem expor dados sensíveis.

## Critérios para ativar publicação real
- Aplicar a migration apenas em homologação autorizada.
- Executar testes com contas de teste e conteúdo claramente identificável como teste.
- Validar permissões, token expirado, limite de API, erro transitório, timeout ambíguo, cancelamento concorrente e duplicidade.
- Aprovar explicitamente credenciais, custos, limites e ambiente antes de habilitar um executor em produção.
- Manter executor desativado por padrão; ausência de credenciais deve falhar em modo seguro.
