var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
//var todos = [];
//var todoNextId = 1;

app.use(bodyParser.json())

app.get('/', function (req, res) {
    res.send('Todo API Root');
});

// GET /todos?completed=false&q=work
app.get('/todos', middleware.requireAuthentication, function (req, res) {
    var query = req.query;
    var where = {}; //req.user.get('id)
    where.userId = req.user.get('id');

    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false
    } else if (query.hasOwnProperty('completed')) {
        res.status(500).send();
    }
    if (query.hasOwnProperty('q') && query.q.length > 0) {
        where.description = {
            $like: '%' + query.q + '%'
        }
    }

    db.todo.findAll({
        where: where
    }).then(function (todo) {
        res.json(todo);
    }, function (e) {
        res.status(500).send();
    })

});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    //switch to find 1 where you can search by ID and userID
    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }

    }).then(function (todo) {
        if (!!todo) {
            res.json(todo.toJSON());
        } else {

            res.status(404).send();

        }
    }, function (e) {
        res.status(500).send();
    })
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');

    body.description = body.description.trim();
    if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
        return res.status(400).send();
    }
    db.todo.create(body).then(function (todo) {
        req.user.addTodo(todo).then(function () {
            return todo.reload();
        }).then(function (todo) {
            res.json(todo.toJSON());
        })
    }, function (e) {
        res.status(400).json(e);
    });

});

// DELETE /todos/:id

app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    /*    var matchedTodo = _.findWhere(todos, {
            id: todoId
        })*/
    //use req.user.get('id')
    db.todo.destroy({
        where: {
            id: todoId,
            // userId: req.user.get('id')
        }
    }).then(function (rowDeleted) {
        if (rowDeleted === 0) {
            res.status(404).json({
                error: 'no todo with id'
            });

        } else {
            res.status(204).send();
        };

    }, function () {
        res.send(500).send();
    })
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    //use the same way you did with get 1 id
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }

    db.todo.findOne({
        where: {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
        if (todo) {
            todo.update(attributes).then(function (todo) {
                res.json(todo.toJSON());
            }, function (e) {
                res.status(400).json(e);

            })
        } else {
            res.status(404).send();
        }
    }, function (e) {
        res.status(500).send();
    })

});


app.post('/users', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    body.email = body.email.trim();

    db.user.create(body).then(function (user) {
        res.json(user.toPublicJSON());
    }, function (e) {
        res.status(400).json(e);
    });
});

// POST /users/login
// make sure they pass in the required fields
// send back req.body

app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');

    db.user.authenticate(body).then(function (user) {
        var token = user.generateToken('authenticate');

        if (token) {
            res.header('Auth', token).json(user.toPublicJSON());
        } else {
            res.status(401).send();

        }
    }, function () {
        res.status(401).send();
    });
});


db.sequelize.sync({
    //force: true
}).then(function () {
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT);
    });
});
