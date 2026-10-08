# Arceuz Academy

Plataforma de cursos com identidade em preto, laranja e branco e a logo original da Arceuz.

Site: https://arceuz-academy.contamateusfortnite.chatgpt.site

## Experiência do visitante

- `/`: apresentação da marca, catálogo com busca e categorias, informações sobre a Arceuz e perguntas frequentes.
- `/cursos/[id]`: descrição, instrutor, preço e programa de cada curso publicado.
- `/checkout/[id]`: matrícula de demonstração após autenticação.
- `/aluno`: cursos do aluno, aulas e progresso persistente.
- `/painel`: gestão de produtos, conteúdo, pedidos, alunos e configurações.

## Estado dos pagamentos

O checkout é uma demonstração. Nenhum Pix é gerado, nenhum cartão é cobrado e nenhuma informação de cartão é coletada. Os registros iniciais e preços são exemplos. Uma matrícula de teste libera as aulas para a conta autenticada.

Para começar a vender de verdade, conectar um provedor de pagamentos, criar pedidos no servidor e liberar acesso somente após confirmação verificável de pagamento. Não usar a ação `checkout-demo` para vendas reais.

## Dados e acesso

O catálogo exibe somente produtos publicados. Títulos e duração das aulas são públicos; conteúdo e vídeos ficam disponíveis apenas para o aluno matriculado. O painel e suas operações exigem a conta do produtor definida pela variável de ambiente `ARCEUZ_OWNER_EMAIL`. Matrículas e progresso ficam associados à identidade recebida da autenticação do Sites.

SQLite no Cloudflare D1 armazena cursos, pedidos, matrículas e progresso. Migrações em `drizzle/`. Segredos, bancos locais, dependências e arquivos de compilação não estão no repositório.

## Desenvolvimento

Node.js 22.13 ou superior. Instalar as dependências com `npm run install:ci`, iniciar com `npm run dev` e compilar com `npm run build`. A documentação do ambiente e das migrações está em `DEVELOPMENT.md`.

O ambiente local usa o login de teste `seedy@sites.test`. Configurar `ARCEUZ_OWNER_EMAIL` em `.dev.vars` para permitir o painel nessa conta. Em produção, definir a variável secreta na hospedagem com o e-mail real do produtor.

## Hospedagem

Esta versão usa React, Vinext e um Worker Cloudflare com D1, publicado pelo Sites. O GitHub guarda o código-fonte. Uma migração direta para a Vercel exige adaptar o acesso ao banco e a autenticação ao ambiente de destino.
