# Nome Limpo Express — Sistema Completo v2.0

Sistema de captacao de leads e operacao comercial para regularizacao financeira.

## Sobre

O Nome Limpo Express (NLE) e um servico de regularizacao financeira baseado em analise tecnico-juridica de negativacoes em orgaos de protecao ao credito (Serasa, SPC Brasil, Boa Vista SCPC).

**Diferencial:** Verificacao se o credor cumpriu o processo legal exigido — quando nao cumpriu, acao formal de remocao com base no CDC, LGPD e jurisprudencia do STJ.

## Produtos

| Produto | Preco | Descricao |
|---------|-------|-----------|
| Limpa Nome | R$ 650 | Analise e remocao de negativacoes irregulares |
| Rating Bancario | R$ 1.400 | Regularizacao de classificacao interna dos bancos (AA-H) |
| BACEN/SCR | R$ 8.000 | Regularizacao no Sistema de Informacoes de Credito do Banco Central |

## Estrutura do Projeto

```
nle-project/
├── README.md
├── .gitignore
├── central-operacoes/
│   └── index.html          ← Hub principal de operacoes
├── landing-page/
│   └── index.html          ← Pagina de captura de leads
├── dashboard/
│   └── index.html          ← Dashboard de gestao (CRM, gerador, links UTM)
├── gerador-anti-padrao/
│   └── index.html          ← Motor de randomizacao 8 camadas
├── onda-organica/
│   └── index.html          ← Calendario estrategico de 30 dias
├── tracker/
│   └── index.html          ← Ranking inteligente de grupos
└── docs/
    ├── prompt-agente-v2.md  ← Prompt de consciencia do agente IA
    ├── scripts-whatsapp.md  ← Scripts completos de fechamento
    └── pacote-conteudo.md   ← Posts prontos para Facebook
```

## Stack Tecnica

| Item | Tecnologia |
|------|-----------|
| Frontend | HTML5 + CSS3 + JavaScript vanilla |
| Persistencia | localStorage (browser) |
| Dependencias externas | ZERO |
| Build system | Nenhum (arquivos estaticos) |
| Arquitetura | Single-file (cada modulo e 1 arquivo HTML autonomo) |

## Modulos

### Central de Operacoes (Hub Principal)
- Gestao de perfis Facebook e grupos
- Distribuicao automatica sem sobreposicao
- Missoes diarias com conteudo gerado
- Scripts WhatsApp integrados
- Export/import de dados

### Landing Page
- Captura de leads com formulario
- Redirect automatico para WhatsApp
- Captura de parametros UTM
- Design responsivo e profissional

### Dashboard
- Visao geral de leads e metricas
- CRM basico com export CSV
- Gerador de conteudo (posts, comentarios, inbox, objecoes)
- Builder de links UTM

### Gerador Anti-Padrao
- Motor de 8 camadas de randomizacao
- 2.000.000+ combinacoes unicas
- Evita deteccao de conteudo repetido pelo Facebook
- Display do DNA do post (variaveis utilizadas)

### Onda Organica
- Calendario visual de 30 dias
- 4 ondas estrategicas (infiltracao → educacao → autoridade → conversao)
- ~50 posts/comentarios pre-gerados
- Exportacao do calendario completo

### Tracker de Grupos
- Algoritmo de scoring composto (cliques, CTR, tendencia, consistencia)
- Sistema de tiers (S/A/B/C)
- Geracao de links UTM por grupo
- Analise automatica por nicho/categoria

## Configuracao

Antes de usar, troque os placeholders:

| O Que | Onde | Trocar Por |
|-------|------|-----------|
| Numero WhatsApp | landing-page/index.html | Seu numero com DDI (5511...) |
| Numero WhatsApp | central-operacoes/index.html (Config) | Seu numero com DDI |
| URL da landing page | dashboard/index.html (Links UTM) | URL real apos deploy |
| URL da landing page | tracker/index.html (Gerar links) | URL real apos deploy |

## Deploy

Cada arquivo e autonomo e funciona independentemente. Deploy em qualquer servidor de arquivos estaticos:

- **GitHub Pages** (gratis)
- **Netlify** (gratis, drag & drop)
- **Vercel** (gratis)
- **Railway** (static site)

Nao precisa de build, compilacao ou configuracao de servidor.

## Persistencia de Dados

Todos os dados ficam no `localStorage` do navegador. Use a funcao de export/import na Central de Operacoes para backup regular.

| Key | Modulo | Conteudo |
|-----|--------|----------|
| nle_pf | Central | Perfis Facebook |
| nle_gr | Central | Grupos |
| nle_dist | Central | Distribuicao |
| nle_ms | Central | Missoes |
| nle_cfg | Central | Configuracoes |
| nle_hist | Central | Historico |
| nle_leads | Landing/Dashboard | Leads capturados |
| nle_groups | Dashboard | Grupos (formato dashboard) |
| nle_links | Dashboard | Links UTM |
| trk_groups | Tracker | Grupos trackados |
| trk_clicks | Tracker | Cliques registrados |

## Estrategia de 4 Ondas (30 Dias)

| Onda | Dias | Objetivo | Acao |
|------|------|----------|------|
| 1 - Infiltracao | 1-7 | Presenca | So comentarios |
| 2 - Educacao | 8-14 | Ensinar | Posts educativos |
| 3 - Autoridade | 15-22 | Referencia | Casos e leis |
| 4 - Conversao | 23-30 | Leads | CTA direto |

---

**Projeto:** Nome Limpo Express v2.0
**Contato:** benn.neto7@gmail.com
