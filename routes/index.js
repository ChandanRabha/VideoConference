const express = require('express');
const router = express.Router();
const { v4: uuidV4 } = require('uuid');
let user_data={}
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>{
  //storing user data in a string object for future refernces
  user_data=req.user;
  res.render('dashboard', {
    user: req.user
  })
}
);

// Create Room Page
 router.get('/create_room', (req,res)=>{res.redirect(`/room/${uuidV4()}`);});
// router.get('/create_room', (req,res)=>{res.send("WORKS")});


// router.get('/room', (req,res)=>res.render("room",{ extractScripts: true },{ roomId: req.params.room_id }));
router.get('/room/:data',ensureAuthenticated, 
(req,res)=>{
  console.log(user_data.name)
res.render("room",{ roomId: req.params.data,user:user_data.name })});




module.exports = router;
