#  Sistema de Gestão para o Arraiá ReisFit

Aplicação web desenvolvida para gerenciar inscrições, controle de participantes, administração financeira e prestação de contas do evento **Arraiá ReisFit**.

O projeto foi construído utilizando **HTML5, CSS3 e JavaScript**, com o **Supabase** como Backend as a Service (BaaS), permitindo sincronização em tempo real entre os módulos públicos e administrativos.

---

## 🚀 Demonstração


**🔗 Aplicação:** https://mescola.github.io/arraia-reisfit/app.html

---

## 📸 Telas do Sistema

| Página de Inscrição | Painel Administrativo |
|----------------------|----------------------|
| ![](docs/screenshots/cadastro.png) | ![](docs/screenshots/admin.png) |

| Lista Pública | Portal da Transparência |
|---------------|------------------------|
| ![](docs/screenshots/lista.png) | ![](docs/screenshots/transparencia.png) |

---

## 🎥 Demonstração

<img src="docs/demo1.gif" width="900">
<img src="docs/demo2.gif" width="900">
---

## Funcionalidades

### Inscrição de Participantes

- Cadastro de participantes
- Cadastro de cônjuge e acompanhantes
- Seleção do prato compartilhado
- Cálculo automático do valor da inscrição
- Validação dos campos obrigatórios

### Lista Pública

- Exibição dos participantes confirmados
- Organização dos pratos cadastrados
- Quantidade de acompanhantes
- Interface responsiva para dispositivos móveis

### Painel Administrativo

- Controle financeiro
- Confirmação de pagamentos via PIX
- Edição inline de registros
- Exclusão com dupla confirmação
- Indicadores financeiros em tempo real

### Portal da Transparência

- Total arrecadado
- Total gasto
- Saldo do evento
- Gastos agrupados por categoria
- Links para notas fiscais e comprovantes

---

# Arquitetura

```text
Participante
      │
      ▼
 Formulário
      │
      ▼
  Supabase
      │
 ┌────┴──────────┐
 ▼               ▼
Lista        Administração
                    │
                    ▼
        Portal da Transparência
```

---

## 📁 Estrutura do Projeto

```text
.
├── index.html
├── lista.html
├── adm.html
├── transparencia.html
│
├── css
│   └── style.css
│
├── js
│   ├── supabase.js
│   ├── cadastro.js
│   ├── lista.js
│   ├── adm.js
│   └── transparencia.js
│
|── screenshots
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
|------------|------------|
| HTML5 | Estrutura da aplicação |
| CSS3 | Layout responsivo e estilização |
| JavaScript (ES6+) | Regras de negócio |
| Supabase | Backend como Serviço |
| PostgreSQL | Banco de Dados |
| Row Level Security (RLS) | Segurança dos dados |

---

## 🔒 Segurança

O projeto utiliza recursos do Supabase para proteção dos dados:

- Row Level Security (RLS)
- Controle de permissões
- Políticas de acesso para leitura e escrita
- Isolamento entre módulos públicos e administrativos

---

## Modelo de Banco de Dados

### cadastro_arraia

| Campo | Tipo |
|--------|------|
| id | int8 |
| nome | text |
| categoria_prato | text |
| sabor_prato | text |
| qtd_conjuge | int4 |
| qtd_amigos | int4 |
| total_pix | numeric |
| status_pix | text |
| created_at | timestamptz |

---

### gastos_arraia

| Campo | Tipo |
|--------|------|
| id | int8 |
| categoria | text |
| descricao | text |
| valor | numeric |
| url_nota | text |
| created_at | timestamptz |

---

## Configuração

Configure o arquivo responsável pela conexão com o Supabase.

```javascript
const SUPABASE_URL = "...";
const SUPABASE_KEY = "...";
```

---

## Deploy

O projeto pode ser hospedado facilmente em:

- GitHub Pages
- Vercel
- Netlify

Como o backend utiliza Supabase, não existe necessidade de servidor próprio.

---

## Roadmap

- [ ] Login utilizando Supabase Auth
- [ ] Controle de permissões (RBAC)
- [ ] Upload de comprovantes pelo Storage
- [ ] Dashboard com gráficos financeiros
- [ ] Exportação em PDF
- [ ] Exportação em Excel
- [ ] Relatórios por participante
- [ ] Histórico de eventos
- [ ] Cadastro de múltiplos eventos

---
## 💡 Principais Desafios Técnicos

Durante o desenvolvimento, alguns desafios exigiram soluções específicas:

- Sincronização em tempo real entre o painel administrativo e o portal da transparência.
- Separação da arrecadação entre participantes e parceiros sem duplicidade de valores.
- Cálculo automático de métricas financeiras e público pagante.
- Implementação de políticas de segurança utilizando Row Level Security (RLS) no Supabase.
- Desenvolvimento de uma interface Mobile First para uso durante o evento.

## 🤖 Desenvolvimento com IA

Este projeto contou com o suporte de Inteligência Artificial Generativa durante o processo de desenvolvimento, utilizando o **Google Gemini** como ferramenta de apoio.

A IA foi utilizada como assistente técnico para:

- Estruturação da arquitetura
- Revisão de código
- Refatoração de funções JavaScript
- Modelagem do banco de dados
- Otimização das consultas ao Supabase

Todas as decisões de arquitetura, implementação e validação permaneceram sob responsabilidade do desenvolvedor.

---

## 👩‍💻 Desenvolvido por

**Márcia Escolástico da Silva**

- LinkedIn: https://linkedin.com/in/SEU-LINKEDIN