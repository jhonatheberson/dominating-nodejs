const express = require("express");

const server = express();
const tasks = ["Nova tarefa"];
cont = new Number(0);
const tarefas = {
  id: "0",
  title: "alo",
  tasks: tasks,
};

server.use(express.json());
const projects = [tarefas];

server.use((req, res, next) => {
  cont = cont + 1;
  console.log(`cont: ${cont}`);

  next();
});

function middlewaresExistId(req, res, next) {
  const { id } = req.params;

  if (!projects[id]) {
    return res.status(400).json({ error: "projects dont exist" });
  }

  return next();
}

server.post("/projects", (req, res) => {
  // const { title } = req.body;

  // const { id } = req.body;

  // const { tasks } = req.body;

  projects.push(req.body);

  return res.json(projects);
});
server.post("/projects/:id/tasks", middlewaresExistId, (req, res) => {
  const { title } = req.body;

  const { id } = req.params;

  // const { tasks } = req.body;

  projects[id]["tasks"] = [title];

  return res.json(projects);
});

server.get("/projects", (req, res) => {
  return res.json(projects);
});

server.put("/projects/:id", middlewaresExistId, (req, res) => {
  const { id } = req.params;

  const { title } = req.body;

  projects[id]["title"] = title;

  return res.json(projects[id]);
});

server.delete("/projects/:id", middlewaresExistId, (req, res) => {
  const { id } = req.params;

  projects.splice(id, 1);

  return res.json(projects);
});

server.get("/teste", () => {
  console.log("teste");
});

server.listen("3000");
