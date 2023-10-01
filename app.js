const express = require("express");
const app = express();
module.exports = app;

app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusPriority = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let getTodoQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE
               todo LIKE '%${search_q}%'
               AND status = '${status}'
               AND priority = '${priority}';
        `;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo
            WHERE
              todo LIKE '%${search_q}%'
              AND priority = '${priority}';
        `;
      break;

    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo
            WHERE 
              todo LIKE '%${search_q}%'
              AND status = '${status}';
        `;
      break;
    default:
      getTodoQuery = `
             SELECT *
             FROM todo
             WHERE 
                todo LIKE '%${search_q}%';
         `;
  }

  const data = await db.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
         SELECT *
         FROM todo
         WHERE
           id = ${todoId};
    `;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});

app.post("/todo/", async (request, response) => {
  const todoDetails = request.body;

  const { id, todo, priority, status } = todoDetails;

  const addTodoQuery = `
        INSERT INTO todo
             (id , todo , priority , status)
        VALUES 
             (${id} , '${todo}',  '${priority}' , '${status}');
    `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status } = request.query;

  let updateQuery = "";

  switch (true) {
    case todo !== undefined:
      updateQuery = `
               UPDATE todo
               SET 
                 todo = '${todo}'
               WHERE 
                 id = ${todoId};
           `;
      await db.run(updateQuery);
      response.send("todo updated");
      break;

    case status !== undefined:
      updateQuery = `
               UPDATE todo
               SET 
                 status = '${status}'
               WHERE 
                 id = ${todoId};
           `;
      await db.run(updateQuery);
      response.send("status updated");
      break;

    case priority !== undefined:
      updateQuery = `
               UPDATE todo
               SET 
                 priority = '${priority}'
               WHERE 
                 id = ${todoId};
           `;
      await db.run(updateQuery);
      response.send("priority updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
        DELETE FROM todo
        WHERE 
           id = ${todoId};
    `;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});
