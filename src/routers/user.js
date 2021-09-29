const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')


router.post('/users', async (req, res)=>{ //by using async the fct will now return a promise
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
    //OLD CODE ==============
    // user.save().then(()=>{ //save to the database
    //     res.status(201).send(user)
    // }).catch((error)=>{
    //     res.status(400).send(error) //set status code to 400
    // })
})

router.post('/users/login', async(req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token}) //user:user, token:token
    }catch (e){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token)=> {
            return token.token !== req.token //removing the correspondant token from the tokens array. this means that if we logout from a device, we will be still logged in on another device
        })
        await req.user.save() 
        res.send()
    }catch(e){
        res.status(500).send()
    }
})


router.post('/users/logoutAll', auth, async(req, res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send(200).send()
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res)=>{ //here it will run first auth, and if everything is fine it continues to run the async request
    res.send(req.user) //get the profile of the authenticated user
})

// router.get('/users/:id', async (req, res)=>{ //not needed anymore
//     const _id = req.params.id

//     try{
//         const user = await User.findById(_id)
//         if(!user){
//             return res.status(404).send()
//         }
//         res.send(user)
//     }catch(e){
//         res.status(500).send()
//     }
//     //OLD CODE =========================
//     // User.findById(_id).then((user)=>{
//     //     if(!user){
//     //         return res.status(404).send()
//     //     }
//     //     res.send(user)
//     // }).catch((error)=>{
//     //     res.status(500).send()
//     // })
// })

router.patch('/users/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body) //properties we are trying to update
    const allowedUpdates = ['name','email','password','age'] //available properties in the User model
    const isValidOperation = updates.every((update)=>{ //checks if the property we are trying to update exists
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){ //if we are trying to update a property that doesnt exist
        return res.status(400).send({error:'Invalid Updates!'})
    }
    try{
        updates.forEach((update)=>req.user[update] = req.body[update])

        await req.user.save()

        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res)=>{
    try{
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

const upload = multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Only jpeg,jpg and png files are allowed'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) =>{
    res.status(400).send({error:error.message})
})

router.delete('/users/me/avatar', auth, async (req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res)=>{
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)
    } catch(e){
        res.status(400).send()
    }
})

module.exports = router