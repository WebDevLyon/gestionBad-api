//Import
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const tournoisRoutes = require('./routes/tournois')

// Création de l'app express
const app=express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors())

// Connexion à MongoDb
mongoose.connect(
	'mongodb+srv://webdevlyonTEST:'+process.env.MongoAPIKey+'@todos.6yuzm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
	{
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(()=>console.log('Connexion à MongDB réussie'))
	.catch(()=> console.log('Connexion à MongoDb échouée'))

app.use('/api/tournois', tournoisRoutes)


app.listen(process.env.PORT || 3000, ()=>
	console.log('Server Started on port ' + process.env.PORT + '...'))