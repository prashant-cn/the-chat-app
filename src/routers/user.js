const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const commonDBModels = require('../db/commonDBModels')
const router = new express.Router()
const authenticate = require('../middleware/authenticate')

//Create Users
router.post('/users', async (req, res) => {
    const user = new commonDBModels.User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch(error) {
        res.status(400).send(error.message)
        console.log(error.message)
    }
})

// Login User
router.post('/users/login', async (req, res) => {
    try {
        const user = await commonDBModels.User.loginUser(req.body.email, req.body.password)
        const token = await user.generateAuthToken() // method on a instance of user to work with an specific user
        res.send({user, token})
        // res.cookie('jwt', token)
        // res.status(200).json({user}) 
    } catch(error) {
        res.status(400).send({error: 'Unable to login'})
    }
})

// Logout user
router.post('/users/logout', authenticate, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send({user:'logged out'})
    } catch(error) {
        res.status(500).send(error)
    }
})


//Logout all devices
router.post('/users/logoutAll', authenticate, async(req, res) => {
    try {
        req.user.tokens =[]
        await req.user.save()
        res.send('Logged out of all devices')
    } catch(error) {
        res.status(500).send(error)
    }
})

// fetch users
router.get('/users/all', authenticate, async (req,res) => {
    try {
        const users = await commonDBModels.User.find({})
        res.send(users)
    } catch(error) {
        res.status(400).send(error)
    }
})

//fetch user profile
router.get('/users/me', authenticate, async (req,res) => {    
    res.send(req.user) // req.user from authenticate middleware
})


// Delete user
router.delete('/users/me', authenticate, async (req, res) => {
    try {
        await req.user.remove()
        accountCacellationMail(req.user.email, req.user.name)
        res.send(req.user)
    } catch(error) {
        res.status(500).send(error.message)
    }
})








module.exports = router