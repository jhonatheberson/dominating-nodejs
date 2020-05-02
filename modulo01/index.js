const express = require('express') // "require importa a dependencia para o arquivo"

// console.log(express)

const server = express() //chamando a função do express, porque ele importa uma função o require
//localhost:3000/teste
//Query params = ?teste=1
//Route params = /users/1
//Request body = {'name':'jhonat' .... }
//*exemplo de requisição body
// server.get('/teste', (req, res) => {







//   return res.json({ 'messages': 'Hello World' }) //enviando variavel pega np quer ex: http://localhost:3000/teste?nome=jhonat

//*exemplo de requisição query
//server.get('/teste', (req, res) => {



// const nome = req.query.nome; // informação que pego dentro da url cliente passa na url 



// return res.json({ 'messages': `Hello ${nome}` }) //enviando variavel pega np quer ex: http://localhost:3000/teste?nome=jhonat}) 
// req: representa todos os dados da requisição[vem do cliente] (usuarios encia parametros[query parms, route parms, body, headers])

//*exemplo de requisição Route
//server.get('/users/:id', (req, res) => {

// console.log("teste") = imprime no terminal

//const { id } = req.params; // informação que pego dentro da url cliente passa na url ex: http://localhost:3000/users/5



// return res.json({ 'user': `buscando o usuarios: ${id}` }) //enviando variavel pega np quer ex: http://localhost:3000/teste?nome=jhonat}) 
// req: representa todos os dados da requisição[vem do cliente] (usuarios encia parametros[query parms, route parms, body, headers])
//res: representa resposta  para cliente(status, informação etc..)

//*exemplo usando base local
// const users = ['jhonat', 'isabel', 'odaiza'];
//server.get('/users/:index', (req, res) => {

// console.log("teste") = imprime no terminal

// const { index } = req.params; // informação que pego dentro da url cliente passa na url ex: http://localhost:3000/users/5



// return res.json(users[index]); //enviando variavel pega np quer ex: http://localhost:3000/teste?nome=jhonat}) 
// req: representa todos os dados da requisição[vem do cliente] (usuarios encia parametros[query parms, route parms, body, headers])
//res: representa resposta  para cliente(status, informação etc..)

//*exemplo CRUD - Create, Read, Update, Delete
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