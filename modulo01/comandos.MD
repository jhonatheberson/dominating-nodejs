`yarn init -y` = cria arquivo package.json

`yarn add express` = instala o pacote express no meu projeto

`yarn add [nome do pacote]` = instala pacote no projeto

`yarn` = instala todas as dependencias do projeto em que estou[diretorio] - dependencias que esta no arquivo package.json
pasta node_modulos = onde fica todas as dependencias

`const express`= require('express')\_ = esta importando a dependencia para o arquivo a qual estou declarando nesse caso é express

`node [nome do arquivo]` = executa o arquivo usando node

`const server = express()` = chamando a função do express, porque ele importa uma função o require

`server.listen([porta])` = coloca server[express()] para escutar na porta exemplo: porta= "3000"

```
server.get('/teste', () => {
console.log("teste")
})
```

= manda server[express()] ter uma get na rota teste, e passo a função que sera executado no caso um
_console.log("teste")_ url: http://localhost:3000/teste

`console.log("teste")` = imprime no terminal a string 'teste'

**req**: representa todos os dados da requisição[vem do cliente] (usuarios encia parametros[query parms, route parms, body, headers])
//Query params = ?teste=1
//Route params = /users/1
//Request bosy ={'name':'jhonat' .... }

**res**: representa resposta para cliente(status, informação etc..)

`res.send('Hello World')` = retorna[envia] para o cliente a mensagem 'hello World'

`return res.json({ 'messages': 'Hello World' })` = retorna[envia] para o cliente uma estrutura json

- # exemplo de requisição body

```
server.get('/teste', (req, res) => {
return res.json({ 'messages': 'Hello World' })
```

= envia json para o cliente

- # exemplo de requisição query

`const nome = req.query.nome;` = pega inrformação dentro da url cliente passa na url ex: http://localhost:3000/teste?nome=jhonat

```
server.get('/teste', (req, res) => {

const nome = req.query.nome;

return res.json({ 'messages': `Hello ${nome}` }) })
```

- # exemplo de requisição params

`const id = req.params.id;` = informação que pego dentro da url cliente passa na url ex: http://localhost:3000/users/5

```
server.get('/users/:id', (req, res) => {

const { id } = req.params;

return res.json({ 'messages':`buscando o usuarios: ${id}` })
})
```

`yarn add nodemon -D` = instala dependencia fica reiniciando node quando ouver mudanças no codigo **-D** significa quando for em produção essa dependencia não sera instalada

vou no arquivo package.json e crio o script para ficar executando o nodemon que agora basta ir no terminal e executar **yarn dev** ou posso executar no terminal **nodemon index.js**
```
"scripts": {
    "dev":"nodemon index.js"
  }
```

`yarn remove [nome do pacote]`
= desintala o pacote [remove do package.json]


- # CRUD - Create, Read, Update, Delete

```server.use(express.json())``` = instancia do express, no caso estou dizendo que o express vai receber json como padrão das requisições
- **use** = adiciona um plugin ao express nesse caso, esse pluguin é **express.json()** que é uma função por isso *()*


```

const express = require('express') // "require importa a dependencia para o arquivo"



const server = express() //instancia express

const users = ['jhonat', 'isabel', 'odaiza'];

server.use(express.json()) // instancia do json, "use" = adiciona um plugin, no caso estou dizendo que o express vai receber json

server.get('/users', (req, res) => {
  return res.json(users);
})

server.get('/users/:index', (req, res) => {

  const { index } = req.params;

  return res.json(users[index]);
});

server.post('/users', (req, res) => {
  const { name } = req.body;

  users.push(name);

  return res.json(users);

});

server.put('/users/:index', (req, res) => {
  const { index } = req.params;

  const { name } = req.body;

  users[index] = name;

  return res.json(users);
});

server.delete('/users/:index', (req, res) => {
  const { index } = req.params;

  users.splice(index, 1); // metodo splice() percorre a lista e quando achar deleta apos essa posição

  return res.send();
})

server.listen(3000) // coloca server(express()) para escutar na porta 3000 
```