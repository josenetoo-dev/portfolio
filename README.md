# José Neto — Portfólio

Portfólio em **HTML, CSS e JavaScript puro**, com identidade preta, grafite e dourada. Nenhum framework, biblioteca de animação ou dependência em produção. Fontes Manrope locais, sob licença SIL OFL.

## Executar

```sh
python3 -m http.server 8080
```

Abra `http://localhost:8080`. O site também funciona diretamente pelo `index.html`. Menu e links de certificados têm alternativas sem JavaScript.

## Estrutura

- `index.html`: conteúdo semântico, SEO e dados estruturados.
- `style.css`: tokens, componentes, breakpoints e movimento reduzido.
- `script.js`: menu responsivo, seção ativa e diálogo de certificados.
- `assets/projects/`: ilustrações SVG conceituais originais; não são screenshots dos sistemas.
- `assets/fonts/`: Manrope e licença.
- `tests/`: validação estática e fluxos de navegador.
- `docs/`: decisões de conteúdo e evidências de validação.

## Validar

Requer Python 3 e Node.js 22+. Dependências abaixo são **apenas de desenvolvimento**.

```sh
npm ci
npm run check
npx playwright install --with-deps chromium firefox webkit
npm test
```

A suíte percorre 320, 390, 768, 1024 e 1440 px em Chromium, Firefox e WebKit; verifica imagens, overflow, erros, menu, Escape, foco, certificados, movimento reduzido e navegação sem JS. Axe-core verifica WCAG A/AA e boas práticas. Evidências ficam em `test-results/`, fora do Git. A automação de CI disponibiliza os arquivos como artifact.

## Conteúdo e publicação

Fontes das descrições e limites das verificações em [docs/CONTENT.md](docs/CONTENT.md). Atualize o domínio de `canonical`, Open Graph, JSON-LD, `robots.txt` e `sitemap.xml` juntos se mudar a URL pública. Domínio atual corresponde ao campo `homepage` do repositório.

`vercel.json` mantém o deploy estático e dispensa instalação de dependências de teste na hospedagem. Não há workflow de publicação neste repositório. A integração Git existente da hospedagem pode criar previews de branches; produção depende do processo de revisão e merge do proprietário.
