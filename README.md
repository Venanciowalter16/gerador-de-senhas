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
- Modo com 6 a 10 palavras aleatórias em português, separadas por hífen, espaço ou ponto.
- Símbolos permitidos configuráveis em **Mais opções**.
- Perfis rápidos: completa, sem símbolos, somente números e senha longa.
- Preferências salvas no navegador, com opção para desativar. Nenhuma senha é salva.
- Opção para excluir `I`, `l`, `1`, `O`, `o` e `0`.
- Copiar, mostrar/ocultar e gerar outra senha.
- Entropia estimada a partir do número de senhas possíveis.
- Tema azul claro ou escuro; preferência de tema também pode ser lembrada.
- Navegação por teclado, foco visível e respeito à preferência por movimento reduzido.

## Segurança e limites

A fonte de aleatoriedade é [`crypto.getRandomValues`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues). O gerador rejeita amostras fora de um intervalo completo para evitar viés de módulo. Também rejeita candidatos sem todos os tipos escolhidos, mantendo distribuição uniforme entre as senhas válidas. Se Web Crypto não estiver disponível, a geração falha sem recorrer a `Math.random`.

A aplicação não faz requisições de rede para gerar senhas e não usa cookies, analytics ou histórico de senhas. A política de conteúdo bloqueia conexões e recursos externos. Somente as preferências (modo, comprimento, tipos, símbolos, número de palavras, separador e tema) são gravadas em `localStorage`, com validação e lista explícita de campos. Nenhuma senha é persistida. Desativar **Lembrar preferências** apaga os ajustes salvos e mantém somente a indicação de que o usuário não quer lembrar. Se o armazenamento estiver bloqueado, a geração continua funcionando durante a sessão.

O modo com palavras sorteia com reposição de uma lista local de 7.776 palavras únicas em português. Repetições são permitidas para preservar a distribuição e a entropia calculada. Cada palavra contribui com aproximadamente 12,92 bits; seis palavras fornecem aproximadamente 77,55 bits. O separador fixo não acrescenta entropia. Lista de [Cícero Mello e colaboradores](https://github.com/cicero-mello/diceware-ptbr), commit `2ce441777462845dd006d959c4574e86add2b2dc`; aviso de copyright e permissão em `WORDLIST_LICENSE.txt`. O conteúdo foi apenas convertido de texto para um array JavaScript, sem alteração das palavras.

Ao copiar, a senha vai para a área de transferência do dispositivo, que pode ter histórico ou sincronização administrados pelo sistema. A aplicação não consegue controlar esse armazenamento. A opção **Ocultar** apenas esconde o texto na tela. Extensões ou um dispositivo comprometido podem acessar o conteúdo da página.

O valor de entropia descreve o espaço de geração, não uma promessa de proteção ou tempo de quebra. Use senhas longas e diferentes para cada conta, guarde-as em um gerenciador e ative autenticação multifator quando disponível. Confira as regras de caracteres do serviço de destino.

## Verificar

Com Node.js 22 ou superior:

```sh
npm run check
npm test
```

Os testes cobrem combinações de tipos, comprimentos extremos, caracteres semelhantes, símbolos personalizados, lista de palavras, frases, ausência de Web Crypto, rejeição de viés, entropia e validação/armazenamento das preferências. O GitHub Actions executa esses comandos em cada push e pull request.

## Estrutura

- `index.html`, `styles.css`, `app.js`: interface.
- `generator.js`: lógica isolada de geração e entropia.
- `preferences.js`: validação e armazenamento das preferências.
- `words.js` e `WORDLIST_LICENSE.txt`: lista de palavras e licença de origem.
- `tests/`: testes com o runner nativo do Node.js.
- `.github/workflows/check.yml`: verificação contínua; não faz deploy.

O site é publicado pelo GitHub Pages a partir da branch `main`, pasta raiz. A publicação usa os arquivos estáticos diretamente, sem Jekyll. Alterações enviadas para `main` iniciam uma nova publicação. A verificação de testes é um workflow separado.
