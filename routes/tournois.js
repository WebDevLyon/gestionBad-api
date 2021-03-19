//Import
const router = require('express').Router()
const Ctrl = require('../controllers/tournois')

//Routes
router.get('/list', Ctrl.getAll)

module.exports = router