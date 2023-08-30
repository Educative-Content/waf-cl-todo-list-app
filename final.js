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
  const username = req.body.username;
  const password = req.body.password;

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  try {
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error:', err);
        req.flash('message', 'An error occurred while processing your request.');
        return res.redirect('/login');
      }

      if (results.length === 0) {
        req.flash('message', 'Invalid username or password');
        res.redirect('/login');
      } else {
        req.session.userId = results[0].id;
        res.redirect('/todos');
      }
    });
  } catch (error) {
    console.error('Error:', error);
    req.flash('message', 'An error occurred while processing your request.');
    res.redirect('/login');
  }
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
  
  app.post("/process-comment", (req, res) => {
    const comment = req.body.comment;
    res.send(comment); 
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
