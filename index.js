const express = require('express')
const app = express()
app.use(express.json())
require('dotenv').config()
const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

function authToken(req, res, next) {
    const authHeader = req.headers['token']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.sendStatus(401)
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

app.get('/', async(req,res) => {
    res.sendStatus(200)
})
.listen(process.env.PORT || 5555, () => {
    console.log('Listening on port ' + process.env.PORT || 5555)
})

app.post('/register', async(req, res) => {
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT) || 10)
        const hash = await bcrypt.hash(req.body.password, salt)
        const user = await prisma.user.create({data: {
            username: req.body.username,
            password: hash
        }})
        const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {expiresIn: '15m'})
        user.token = `Bearer ${token}`
        res.status(200).send({user})
    }
    catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

app.post('/login', async(req, res) => {
    try {
        const user = await prisma.user.findUnique({where: {username: req.body.username}})
        const isAuthed = await bcrypt.compare(req.body.password, user.password)
        if (isAuthed)
            {
                const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {expiresIn: '15m'})
                user.token = `Bearer ${token}`
                res.status(200).send({user})
            }
        else
            res.status(400).send({message: 'Authentication failed'})
    }
    catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

app.get('/tokenCheck', authToken, (req, res) => {
    res.status(200).send({user: req.user, token: req.headers.auth})
})

app.get('/search/:query', authToken, async(req,res) => {
    try {
        const users = await prisma.user.findMany({where: {username: {contains: req.params.query, mode: 'insensitive'}}})
        const rUsers = users.map(u => delete u.password)
        res.status(200).send({users: users})
    }
    catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})