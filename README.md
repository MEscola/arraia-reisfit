# Sistema de Inscrição e Gestão - Arraiá ReisFit

Este repositório contém o código-fonte de uma aplicação web voltada para o gerenciamento de inscrições, controle de público, fluxo financeiro e prestação de contas do evento Arraiá ReisFit. O sistema foi desenvolvido com foco na usabilidade em dispositivos móveis (Mobile-First) e utiliza uma arquitetura baseada em serviços para persistência de dados em tempo real.

## Estrutura do Projeto

O ecossistema da aplicação é distribuído nos seguintes arquivos principais:

* **`index.html`**: Interface principal contendo o formulário público de inscrição para os participantes.
* **`lista.html`**: Interface pública que exibe a listagem de pratos confirmados e o tamanho dos grupos de forma organizada.
* **`adm.html`**: Painel restrito voltado para a administração financeira e gerenciamento de participantes do evento.
* **`transparencia.html`**: Portal público de prestação de contas, exibindo o balanço real de arrecadação, categorias de despesas e notas fiscais/comprovantes.
* **`js/supabase.js`**: Arquivo de configuração central da conexão e inicialização do cliente do banco de dados (Supabase).
* **`js/cadastro.js`**: Scripts responsáveis pela validação e envio dos dados do formulário de inscrição.
* **`js/lista.js`**: Componente lógico que realiza a busca assíncrona dos dados e renderiza os cartões informativos na listagem pública.
* **`js/adm.js`**: Módulo administrativo que processa indicadores financeiros, possibilita a validação de pagamentos via PIX, além de permitir a edição e exclusão de registros diretamente na interface (inline).
* **`js/transparencia.js`**: Módulo que processa os recursos recebidos em sincronia com a ADM, calcula custos por categoria e renderiza a tabela de despesas do portal.
* **`css/style.css`**: Folha de estilos centralizada que garante a responsividade e o padrão visual escuro da aplicação.

## Tecnologias Utilizadas

* **Frontend**: HTML5 Puro, CSS3 Avançado (recursos de Flexbox e responsividade integrada) e JavaScript Moderno (ES6+ utilizando sintaxe assíncrona Async/Await).
* **Backend como Serviço (BaaS)**: Supabase (PostgreSQL) para armazenamento de dados, consultas em tempo real e persistência das modificações.
* **Segurança de Banco de Dados**: Políticas de Segurança em Nível de Linha (Row Level Security - RLS) configuradas diretamente no banco de dados para isolar operações de leitura (`SELECT`), escrita (`INSERT`), modificação (`UPDATE`) e remoção (`DELETE`).

## Funcionalidades Implementadas

### Painel Público & Inscrições
* Formulário de cadastro dinâmico com captura de acompanhantes (cônjuges e amigos) e categorização de pratos.
* Visualização pública de confirmados em formato estruturado verticalmente para evitar problemas de exibição em smartphones.
* Badges indicativos de status de confirmação com cores estilizadas de forma sutil.

### Portal da Transparência (Prestação de Contas)
* Bloco de Resumo Geral exibindo o total arrecadado, total gasto e o saldo final do caixa em tempo real.
* Divisão detalhada de recursos recebidos: "Participantes" (soma de inscrições comuns + taxas de acompanhantes) e "Parceiros" (faturamento puro de patrocínios/doações via PIX), em perfeita sincronia com as gavetas financeiras da ADM.
* Gráfico/Resumo dinâmico de despesas ordenado automaticamente pelo maior gasto por categoria (Alimentação, Bebidas, Brindes/Bingo, Decoração, Infraestrutura, etc.).
* Tabela de prestação de contas detalhada com link direto para visualização de notas fiscais ou comprovantes anexados (`url_nota`).

### Painel Administrativo
* Autenticação local em sessão (`sessionStorage`) com validação de senha para proteção do ambiente restrito.
* Balancete financeiro automatizado exibindo o faturamento real arrecadado e a receita prevista em tempo real.
* Métrica automatizada de público pagante real com base nos custos de acompanhantes e regras de isenção customizadas (Isenção Total 100% e Isenção Titular 50%).
* Edição inline de registros, permitindo correções de nomes, quantidades de convidados, pratos e valores sem redefinir a página.
* Sistema de exclusão com dupla confirmação para segurança operacional contra remoções acidentais.

## Configuração do Banco de Dados

Para o pleno funcionamento da aplicação, o banco de dados no Supabase deve conter a seguinte estrutura de tabelas e colunas:

### 1. Tabela `cadastro_arraia` (Participantes)
* `id` (int8, Chave Primária, Autoincremento)
* `nome` (text)
* `categoria_prato` (text)
* `sabor_prato` (text, opcional)
* `qtd_conjuge` (int4)
* `qtd_amigos` (int4)
* `total_pix` (numeric)
* `status_pix` (text)
* `created_at` (timestamptz)

### 2. Tabela `gastos_arraia` (Prestação de Contas)
* `id` (int8, Chave Primária, Autoincremento)
* `categoria` (text) — Ex: *Alimentação, Bebidas, Infraestrutura*
* `descricao` (text) — Ex: *Aluguel de cadeiras e pula-pula*
* `valor` (numeric) — Valor do gasto realizado
* `url_nota` (text, opcional) — Link do arquivo/comprovante armazenado
* `created_at` (timestamptz)

> 🔐 **Políticas de RLS:** As tabelas possuem o Row Level Security ativado, associadas às roles `anon` e `authenticated` para garantir o fluxo correto e protegido de dados entre o formulário, a lista pública, o portal da transparência e o painel administrativo.

## Boas Práticas e Controle de Cache

Para o deploy em servidores de arquivos estáticos (como o GitHub Pages), o projeto adota a prática de **Cache Busting** nas chamadas de scripts do ecossistema. Sempre que modificações estruturais forem realizadas nos arquivos lógicos (`js/`), a string de versão no arquivo HTML correspondente deve ser incrementada para forçar o navegador do usuário a carregar o código mais recente:

```html
<script src="js/transparencia.js?v=5"></script>

## Próximas Evoluções (Roadmap)

Embora a arquitetura atual tenha sido desenhada de forma simplificada para atender a um evento pontual com máxima agilidade, o ecossistema foi estruturado pensando em futuras expansões para um modelo SaaS corporativo. Os próximos passos planejados para o projeto incluem:

* **Autenticação Robusta (RBAC):** Integração com o módulo nativo do `Supabase Auth` via JWT, substituindo a validação local por login por e-mail/senha com níveis de acesso (Admin, Organizador, Participante).
* **Segurança de RLS Estrita:** Refatoração das políticas de Row Level Security para bloquear completamente operações de `UPDATE` e `DELETE` para usuários anônimos (`anon`), amarrando a escrita estritamente à role `authenticated`.
* **Proteção de Dados Sensíveis:** Ocultação de colunas financeiras (como `total_pix` e `status_pix`) nas requisições da listagem pública, garantindo a privacidade dos dados na camada do banco de dados.
* **Automação de Comprovantes:** Integração com APIs de Storage para upload direto das imagens de notas fiscais e geração de PDFs automatizados de recibos para prestadores de serviço pessoa física.

## 🤖 Desenvolvimento Auxiliado por IA

Este projeto foi desenvolvido utilizando práticas de engenharia de software com o suporte de Inteligência Artificial (Generative AI), utilizando como ferramenta principal o Google Gemini. A tecnologia foi integrada ao fluxo de trabalho como um copiloto técnico para a aceleração do ciclo de entrega, auxiliando no refinamento de funções assíncronas em JavaScript, sincronização de regras lógicas do balancete financeiro e estruturação das tabelas no Supabase.