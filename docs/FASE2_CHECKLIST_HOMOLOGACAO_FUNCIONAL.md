# Fase 2 — Checklist de homologação funcional

## Situação
Os testes automatizados da branch devem permanecer verdes antes da homologação visual. Este checklist não autoriza publicação externa nem alteração do Supabase de produção.

## Preparação segura
- [ ] Confirmar que o painel de homologação está executando o commit da branch `feat/publicacao-automatica-fase2`.
- [ ] Confirmar que a migration `202610100003_enat_publication_jobs.sql` foi aplicada somente ao projeto/banco isolado de homologação.
- [ ] Usar conta administrativa de teste e conteúdo de teste sem dados pessoais.
- [ ] Confirmar que worker/cron de publicação externa está desativado.
- [ ] Não usar contas sociais reais nem inserir tokens em campos do frontend.

## Casos de teste do painel
| ID | Caso | Resultado esperado |
|---|---|---|
| UI-01 | Abrir aba Editorial como administrador | Formulário editorial, fila e calendário carregam sem erro no console |
| UI-02 | Abrir a mesma aba como usuário sem permissão administrativa | Fila e ações ficam bloqueadas |
| UI-03 | Escolher conteúdo aprovado, canal e data futura | Agendamento é gravado e aparece na fila |
| UI-04 | Atualizar a página após agendar | O job continua visível, sem depender do estado local do navegador |
| UI-05 | Tentar agendar rascunho/rejeitado | A interface e o banco recusam a operação |
| UI-06 | Tentar duplicar conteúdo/canal ativo ou publicado | O banco recusa a duplicação e a interface informa a situação |
| UI-07 | Cancelar job queued | Estado passa a cancelled; não volta à fila ativa |
| UI-08 | Tentar cancelar job publishing/published/failed | A interface recusa conforme a regra de estado |
| UI-09 | Simular falha e solicitar nova tentativa | Apenas job failed é reprogramado; conteúdo precisa continuar aprovado |
| UI-10 | Rebaixar conteúdo aprovado para rascunho após agendar e deixar vencer | Worker não reivindica o job |
| UI-11 | Ver calendário existente | Dias com conteúdo editorial permanecem identificáveis; dias com jobs mostram indicador azul/contagem |
| UI-12 | Verificar mensagens e logs | Nenhum token ou segredo aparece; fila nunca afirma publicação externa real nesta etapa |

## Evidências a registrar
Para cada caso, registrar resultado (passou/falhou), commit testado, ambiente, horário, captura de tela e erro sanitizado, se houver. Não incluir tokens, cookies, chaves ou dados pessoais.

## Critérios para aceite funcional da fila
- Todos os casos UI-01 a UI-12 aprovados, ou falhas documentadas e corrigidas.
- CI de sintaxe e testes de banco verde para o commit exato homologado.
- Migration validada apenas no banco isolado de homologação.
- Nenhum deploy ou migration em produção sem autorização explícita.

## Escopo ainda fora do aceite da fila
A publicação externa real exige adaptadores oficiais de Meta, LinkedIn e X, OAuth/permissões, segredos do servidor, executor periódico, idempotência/reconciliação e testes com contas de homologação. A fila sozinha não conclui essa parte.
