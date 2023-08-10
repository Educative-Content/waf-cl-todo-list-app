const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');
const mysql = require('mysql');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(flash());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'abcd1234',
  database: 'my_db'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected');
  }
});

app.set('view engine', 'ejs'); // Using EJS for views
app.set('views', __dirname + '/views'); // Set views directory

// Homepage
app.get('/', (req, res) => {
    res.render('home');
  });


// Registration Page
app.get('/register', (req, res) => {
  res.render('register', { message: req.flash('message') });
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  // Insert new user into the database
  const newUser = { username, password };
  db.query('INSERT INTO users SET ?', newUser, (err, result) => {
    if (err) {
      req.flash('message', 'Registration failed');
      res.redirect('/register');
    } else {
      req.flash('message', 'Registration successful');
      res.redirect('/login');
    }
  });
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login', { message: req.flash('message') });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Check user credentials in the database
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0 || results[0].password !== password) {
      req.flash('message', 'Invalid username or password');
      res.redirect('/login');
    } else {
      req.session.userId = results[0].id;
      res.redirect('/todos');
    }
  });
});

// add Todo
app.post('/add-todo', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      res.redirect('/login');
      return;
    }
  
    const { todoText } = req.body;
    const newTodo = { user_id: userId, text: todoText };
    db.query('INSERT INTO todos SET ?', newTodo, (err, result) => {
      if (err) throw err;
      res.redirect('/todos');
    });
  });

// Todo List Page
app.get('/todos', (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.redirect('/login');
    return;
  }

  // Retrieve user's todo items from the database
  db.query('SELECT * FROM todos WHERE user_id = ?', [userId], (err, results) => {
    if (err) throw err;
    const todos = results;
    res.render('todos', { todos });
  });
});

// ... Other routes ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
