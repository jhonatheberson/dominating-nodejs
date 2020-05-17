# modulo02

## sucrase

- adionando nova forma de import

  ```
  const express = require('express');
  ```

  para isso acontecer precisamos adicionar um library

  ```
  yarn add sucrase -D
  ```

  pronto agora é so importar tudo assim.

  ```
  import express from 'express';
  ```

  vale ressaltar que isso ja é realizado no javascript, somente a versão do **node 12**, não consegue fazer isso.

  também posso mudar a forma de export

  de

  ```
  module.exports = new App().server;
  ```

  para

  ```
  export default new App().server;
  ```

  mas para isso funcionar precimos criar um arquivo na pasta raiz,

  **nodemon.js**

  com seguinte conteudo.

  ```
  {
  "execMap": {
    "js": "node -r sucrase/register"
  }
  }

  ```

  isso fara que execute o sucrase em todo arquivo js, que seja executado no node.

  porém o modo de debug não irá funcionar , para funcinar precisamos altera algumas mudanças no arquivo **package.json**

  colocando o seguinte script:

  ```
  "dev:debug": "nodemon --inspect src/server.js"
  ```

  e alterar o arquivo de configuração do debug do vcsode

  **.vscode/launch.json**

  para essa forma

  ```
    {
  // Use o IntelliSense para aprender sobre possíveis atributos.
  // Passe o mouse para ver as descrições dos atributos existentes.
  // Para obter mais informações, visite: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [

    {
      "type": "node",
      "request": "attach",
      "name": "Executar Programa",
      "restart": true,
      "protocol": "inspector"
    }
  ]
  }
  ```
