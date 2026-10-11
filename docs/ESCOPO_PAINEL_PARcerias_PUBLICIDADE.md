# Escopo congelado — Painel de Parcerias e Publicidade do Neurotrânsito

## Decisão de produto
O objetivo prioritário é gerir parcerias comerciais e publicações patrocinadas dentro da Rede Neurotrânsito. Distribuição automática para redes sociais externas NÃO é o objetivo principal desta entrega.

## Congelamento de escopo
Até revisão e aceite explícitos:
- Não adicionar canais/redes sociais.
- Não ampliar automação multicanal, OAuth, cron ou worker de publicação.
- Não ativar publicação externa; `ENAT_SOCIAL_PUBLISHING_ENABLED` permanece desativada.
- Não aplicar migrations ao Supabase de produção, não fazer deploy de produção e não mesclar a PR #37.
- Manter o painel editorial como módulo separado e complementar.

## Auditoria do que já existe
### Reaproveitar
- Cadastro editorial, estados de aprovação e trilha de atualização: origem do conteúdo/campanha.
- Calendário existente: datas de campanha e publicação, sem criar agenda paralela.
- Autorização administrativa CMNT/ENAT e RLS: base de acesso ao módulo comercial.
- Fila de publicação: somente como etapa de entrega futura, depois de campanha aprovada e paga; não implica publicação social automática.

### Manter isolado / fora do fluxo comercial
- Adaptadores Meta (Instagram/Facebook), LinkedIn e X.
- Worker, RPCs de reivindicação/finalização e qualquer cron de distribuição externa.
- Tokens, OAuth e segredos de redes sociais.
Esses componentes ficam inativos e não são pré-requisito para publicar conteúdo patrocinado dentro do próprio Neurotrânsito.

## Fluxo comercial obrigatório
1. Parceiro: cadastro e contato comercial.
2. Proposta: escopo, inventário/formato, preço, datas, validade e condições.
3. Aprovação: aprovação administrativa registrada; propostas recusadas não avançam.
4. Pagamento: registrar valor, método, referência e situação. O sistema não presume pagamento confirmado nem integra cobrança nesta etapa.
5. Campanha/publicação: só liberar quando proposta aprovada e pagamento confirmado manualmente por usuário autorizado. Datas, posição, criativo/link e responsável ficam registrados.
6. Comprovação: anexar/registrar URL publicada, data, captura/arquivo e observações de entrega.
7. Relatório: status, valor contratado/recebido, datas, entregas e métricas disponíveis. Não inventar impressões/cliques; mostrar apenas dados registrados ou provenientes de integração real.

## Regras de segurança e consistência
- Todos os dados são administrativos e protegidos por RLS usando `public.cmnt_is_admin()`.
- Valores monetários usam `numeric(12,2)`; nada de ponto flutuante.
- Status e transições são controlados no banco.
- Não armazenar dados de cartão, CVV, senhas ou tokens de pagamento.
- Registrar eventos comerciais sem segredos no log de auditoria.
- Não permitir publicar campanha antes da aprovação e confirmação do pagamento.
- Testes e migrations exclusivamente em Supabase local/isolado.

## Aceite e homologação
A implementação só é homologada após:
- CI verde no commit exato.
- Testes de banco/RLS e transições de status aprovados em Supabase local.
- Revisão visual do painel comercial em ambiente isolado.
- Testes de ponta a ponta com parceiro/proposta fictícios, sem transação financeira real.
- Confirmação de que produção, cron externo e integrações sociais permaneceram intactos.

## Estado desta entrega
Este documento congela o escopo e orienta o módulo comercial. A migration de modelo comercial é apenas código versionado; não foi aplicada a qualquer projeto Supabase hospedado. A UI ainda precisa ser integrada e homologada em preview isolado.