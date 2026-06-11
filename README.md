# Sistema de Inscrição e Gestão - Arraiá ReisFit

Este repositório contém o código-fonte de uma aplicação web voltada para o gerenciamento de inscrições, controle de público e fluxo financeiro do evento Arraiá ReisFit. O sistema foi desenvolvido com foco na usabilidade em dispositivos móveis (Mobile-First) e utiliza uma arquitetura baseada em serviços para persistência de dados em tempo real.

## Estrutura do Projeto

O ecossistema da aplicação é distribuído nos seguintes arquivos principais:

* **`index.html`**: Interface principal contendo o formulário público de inscrição para os participantes.
* **`lista.html`**: Interface pública que exibe a listagem de pratos confirmados e o tamanho dos grupos de forma organizada.
* **`adm.html`**: Painel restrito voltado para a administração financeira do evento.
* **`js/supabase.js`**: Arquivo de configuração central da conexão e inicialização do cliente do banco de dados.
* **`js/cadastro.js`**: Scripts responsáveis pela validação e envio dos dados do formulário de inscrição.
* **`js/lista.js`**: Componente lógico que realiza a busca assíncrona dos dados e renderiza os cartões informativos na listagem pública.
* **`js/adm.js`**: Módulo administrativo que processa indicadores financeiros, possibilita a validação de pagamentos via PIX, além de permitir a edição e exclusão de registros diretamente na interface (inline).
* **`css/style.css`**: Folha de estilos centralizada que garante a responsividade e o padrão visual escuro da aplicação.

## Tecnologias Utilizadas

* **Frontend**: HTML5 Puro, CSS3 Avançado (recursos de Flexbox e responsividade integrada) e JavaScript Moderno (ES6+ utilizando sintaxe assíncrona Async/Await).
* **Backend como Serviço (BaaS)**: Supabase (PostgreSQL) para armazenamento de dados, consultas em tempo real e persistência das modificações.
* **Segurança de Banco de Dados**: Políticas de Segurança em Nível de Linha (Row Level Security - RLS) configuradas diretamente no banco de dados para isolar operações de leitura (`SELECT`), escrita (`INSERT`), modificação (`UPDATE`) e remoção (`DELETE`).

## Funcionalidades Implementadas

### Painel Público
* Formulário de cadastro dinâmico com captura de acompanhantes (cônjuges e amigos) e categorização de pratos.
* Visualização pública de confirmados em formato estruturado verticalmente para evitar problemas de exibição em smartphones.
* Badges indicativos de status de confirmação com cores estilizadas de forma sutil.

### Painel Administrativo
* Autenticação local em sessão (`sessionStorage`) com validação de senha para proteção do ambiente restrito.
* Balancete financeiro automatizado exibindo o faturamento real arrecadado e a receita prevista em tempo real.
* Métrica automatizada de público pagante real com base nos custos de acompanhantes e regras de isenção.
* Edição inline de registros, permitindo correções de nomes, quantidades de convidados, pratos e valores sem redefinir a página.
* Sistema de exclusão com dupla confirmação para segurança operacional contra remoções acidentais.

## Configuração do Banco de Dados

Para o pleno funcionamento da aplicação, a tabela `cadastro_arraia` no Supabase deve conter a seguinte estrutura de colunas:

* `id` (int8, Chave Primária, Autoincremento)
* `nome` (text)
* `categoria_prato` (text)
* `sabor_prato` (text, opcional)
* `qtd_conjuge` (int4)
* `qtd_amigos` (int4)
* `total_pix` (numeric)
* `status_pix` (text)
* `created_at` (timestamptz)

As políticas de RLS devem estar habilitadas e associadas às roles `anon` e `authenticated` utilizando expressões lógicas apropriadas para garantir o fluxo correto de dados entre o formulário, a lista pública e o gerenciamento administrativo.