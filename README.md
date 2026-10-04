# chave. — Gerador de senhas

Um gerador de senhas em português, com interface responsiva, temas claro e escuro e geração local no navegador. Sem cadastro, dependências, serviços externos ou histórico de senhas.

## Usar

**Online:** [abrir o gerador de senhas](https://venanciowalter16.github.io/gerador-de-senhas/).

Baixe o repositório e abra **index.html** em um navegador atualizado. Escolha de 8 a 64 caracteres, ajuste os tipos e clique em **Copiar senha**. Se a cópia automática estiver indisponível, a página seleciona a senha para copiar manualmente.

Também pode servir a pasta localmente, se tiver Python instalado:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Abra http://localhost:8080. Não há etapa de build nem necessidade de instalar pacotes.

## Recursos

- Comprimento ajustável por controle deslizante ou número.
- Letras maiúsculas, minúsculas, números e símbolos.
- Pelo menos um caractere de cada tipo selecionado.
- Opção para excluir `I`, `l`, `1`, `O`, `o` e `0`.
- Copiar, mostrar/ocultar e gerar outra senha.
- Entropia estimada a partir do número de senhas possíveis.
- Tema inicial respeita a preferência do sistema; troca manual durante a sessão.
- Navegação por teclado, foco visível e respeito à preferência por movimento reduzido.

## Segurança e limites

A fonte de aleatoriedade é [`crypto.getRandomValues`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues). O gerador rejeita amostras fora de um intervalo completo para evitar viés de módulo. Também rejeita candidatos sem todos os tipos escolhidos, mantendo distribuição uniforme entre as senhas válidas. Se Web Crypto não estiver disponível, a geração falha sem recorrer a `Math.random`.

A aplicação não faz requisições de rede para gerar senhas, não usa cookies, armazenamento local, analytics ou histórico. A política de conteúdo bloqueia conexões e recursos externos. O tema e as senhas ficam apenas na memória da página.

Ao copiar, a senha vai para a área de transferência do dispositivo, que pode ter histórico ou sincronização administrados pelo sistema. A aplicação não consegue controlar esse armazenamento. A opção **Ocultar** apenas esconde o texto na tela. Extensões ou um dispositivo comprometido podem acessar o conteúdo da página.

O valor de entropia descreve o espaço de geração, não uma promessa de proteção ou tempo de quebra. Use senhas longas e diferentes para cada conta, guarde-as em um gerenciador e ative autenticação multifator quando disponível. Confira as regras de caracteres do serviço de destino.

## Verificar

Com Node.js 22 ou superior:

```sh
npm run check
npm test
```

Os testes cobrem todas as combinações de tipos, comprimentos extremos, caracteres semelhantes, validação, ausência de Web Crypto, rejeição de viés e cálculo de entropia. O GitHub Actions executa esses comandos em cada push e pull request.

## Estrutura

- `index.html`, `styles.css`, `app.js`: interface.
- `generator.js`: lógica isolada de geração e entropia.
- `tests/`: testes com o runner nativo do Node.js.
- `.github/workflows/check.yml`: verificação contínua; não faz deploy.

O site é publicado pelo GitHub Pages a partir da branch `main`, pasta raiz. A publicação usa os arquivos estáticos diretamente, sem Jekyll. Alterações enviadas para `main` iniciam uma nova publicação. A verificação de testes é um workflow separado.
