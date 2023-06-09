const express = require('express')
const app = express()
app.use(express.json())
require('dotenv').config()
const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')

app.get('/', async(req,res) => {
    res.sendStatus(200)
})
.listen(process.env.PORT || 5555, () => {
    console.log('Listening on port ' + process.env.PORT || 5555)
})