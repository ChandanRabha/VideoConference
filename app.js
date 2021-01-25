//including required libraries from node modules to the project 
//here in the lines below a constant variable is storing library data of the libraries which is needed for the project
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const PORT = process.env.PORT || 5000;
const app = express();
const server = require('http').Server(app);
const listen=app.listen(PORT, console.log(`Server started on port ${PORT}`));
const io = require('socket.io').listen(listen);
app.use(express.static('public'));
// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true ,useUnifiedTopology: true}
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set("layout extractScripts", true);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));



//SOCKET STUFF
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
      
      socket.to(roomId).broadcast.emit('user-connected', userId);
      //  io.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
    socket.on('Sendmessage',msg=>{
      console.log(msg);
      io.in(roomId).emit('sent',msg);
    }); 
  });
  
});
