# AVA ENAT-HSI — Plano de Testes e Aceitação

## Testes críticos
- Cadastro e login.
- Recuperação de senha.
- Controle de acesso por perfil.
- Criação de curso.
- Criação de módulo.
- Criação de aula.
- Upload e download de PDF.
- Reprodução de áudio.
- Reprodução de vídeo.
- Link externo.
- Matrícula.
- Progresso.
- Quiz e tentativa.
- Nota e feedback.
- Agendamento de live.
- Entrada na sala.
- Registro de presença.
- Associação de gravação.
- Emissão e validação de certificado.
- Responsividade.
- Acessibilidade básica.
- RLS e acesso indevido.

## Critérios de aceitação
Nenhuma função crítica pode depender de dados mockados em produção. Usuário não autenticado não pode acessar conteúdo privado. Aluno não pode acessar dados de outro aluno. Professor não pode administrar usuários fora de sua competência. Arquivos privados não podem ser acessados por URL pública permanente sem justificativa.

## Teste de transmissão
Executar uma sessão piloto com pelo menos dois participantes, testar entrada, câmera, microfone, compartilhamento, chat, presença, encerramento e replay. Repetir com rede móvel para validar degradação controlada.
