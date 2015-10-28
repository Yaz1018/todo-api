var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json())

app.get('/', function (req, res) {
    res.send('Todo API Root');
});

// GET /todos
app.get('/todos', function (req, res) {
    res.json(todos);
})
// GET /todos/:id
app.get('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: todoId})

    //itterate over todos array using a forEach
/*    todos.forEach(function (todo) {
        if (todoId === todo.id) {
            matchedTodo = todo;
        }
    });*/
    //itterate over todos array using a for loop
/*
    for (i = 0; i < todos.length; i++) {
        if (todoId === todos[i].id) {
            matchedTodo = todos[i];
        }
    }
*/

    if (matchedTodo) {
        res.json(matchedTodo);
    } else {
        res.status(404).send();
    }

});

// POST /todos
app.post('/todos', function(req, res) {
    var body = req.body; //use _.pick to only pick description and completed

    if (!_.isBoolean(body.completed || !_.isString(body.description) || body.description.trim().length === 0)) {
        return res.status(400).send();
    }



    // set body.description to be trimed value

    body.description = body.description.trim();

    body.id = todoNextId++;

    todos.push(_.pick(body, 'id', 'description', 'completed'));

    res.json(_.pick(body, 'id', 'description', 'completed'));
})

app.listen(PORT, function() {
    console.log('Express listening on port ' + PORT);
});
