# AVA ENAT-HSI — Arquitetura e Implantação

## 1. Objetivo
Plataforma educacional online do CMNT para cursos, módulos, aulas, materiais, avaliações, acompanhamento de progresso, certificados e aulas ao vivo.

## 2. Princípios
- Experiência acolhedora, moderna e responsiva.
- Separação entre conteúdo público, área do aluno, professor e administração.
- Segurança por perfil e menor privilégio.
- Conteúdo multimídia como recurso nativo da aula.
- Rastreabilidade de matrícula, progresso, avaliações e presença.
- Arquitetura preparada para videoconferência ao vivo e gravações.

## 3. Perfis
### Administrador
Gerencia usuários, cursos, matrículas, permissões, conteúdo, transmissões, relatórios e certificados.

### Professor
Cria e organiza módulos/aulas, publica materiais, agenda aulas ao vivo, acompanha presença e desempenho.

### Aluno
Acessa cursos matriculados, materiais, atividades, avaliações, aulas ao vivo, gravações e certificados.

### Conteudista/Editor
Produz e revisa conteúdo sem acesso a funções administrativas sensíveis.

## 4. Domínios funcionais
1. Autenticação e perfis
2. Catálogo de cursos
3. Matrículas
4. Módulos e aulas
5. Biblioteca multimídia
6. Atividades e avaliações
7. Progresso e trilhas
8. Aulas ao vivo
9. Presença
10. Certificados
11. Notificações
12. Relatórios e auditoria

## 5. Modelo de aula
Cada aula pode conter:
- texto rico;
- PDF/documento;
- apresentação;
- áudio;
- vídeo enviado;
- vídeo externo;
- link complementar;
- atividade;
- quiz;
- material para download;
- aula ao vivo vinculada;
- gravação posterior;
- requisito de conclusão.

## 6. Videoconferência
A entidade `ava_live_classes` deve ser independente do fornecedor. Campos recomendados:
- provider;
- room_url;
- recording_url;
- scheduled_at;
- duration_minutes;
- instructor_id;
- lesson_id/course_id;
- status;
- access_policy.

Isso permite começar com uma sala externa e evoluir para uma infraestrutura nativa sem alterar o modelo pedagógico.

## 7. Dados recomendados
- ava_courses
- ava_modules
- ava_lessons
- ava_materials
- ava_enrollments
- ava_progress
- ava_assessments
- ava_assessment_attempts
- ava_live_classes
- ava_attendance
- ava_certificates
- ava_notifications
- ava_audit_log

## 8. Armazenamento
Arquivos privados devem utilizar armazenamento protegido, com autorização por usuário/curso. O frontend nunca deve receber credenciais administrativas ou chaves privilegiadas.

## 9. Segurança
- RLS em tabelas expostas ao cliente.
- Usuário só acessa seus cursos/matrículas/progresso.
- Professor acessa apenas cursos sob sua responsabilidade.
- Administração possui permissões separadas.
- Auditoria para operações críticas.
- URLs temporárias para arquivos privados quando necessário.

## 10. Certificação
O AVA deve emitir certificado de conclusão com identificação do aluno, curso, carga horária, período, código de validação e QR Code. O texto do certificado deve refletir exatamente a natureza jurídica/educacional do curso e não declarar acreditação oficial inexistente.

## 11. Fases de implantação
### Fase 1 — Fundação
Interface, autenticação, perfis, catálogo, cursos, módulos, aulas e materiais.

### Fase 2 — Aprendizagem
Progresso, avaliações, banco de questões, notas, trilhas e certificados.

### Fase 3 — Transmissão
Agenda, sala ao vivo, presença, chat, gravação e replay.

### Fase 4 — Escala
Analytics, notificações, automações, relatórios, multi-instituição e integrações.

## 12. Integração com ecossistema ENAT
O AVA permanece independente da Central ENAT-HSI e do NeuroDrive, mas poderá compartilhar identidade, links e indicadores por APIs controladas.

## 13. Critério de pronto
A versão inicial será considerada implantável quando um administrador conseguir criar curso > módulo > aula > material; matricular aluno; o aluno conseguir estudar e marcar progresso; professor conseguir acompanhar; e o sistema registrar tudo de forma segura.
