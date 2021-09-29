const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res)=>{
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner:req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
    //OLD CODE==============================
    // task.save().then(()=>{
    //     res.status(201).send(task)
    // }).catch((error)=>{
    //     res.status(400).send(error)
    // })
})

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=0
//GET /tasks?sortBy=createdAt:asc (or) createdAt:desc (ascending and descending order)
router.get('/tasks', auth, async (req, res)=>{
    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'//return boolean true if the string is equal to true
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{
        await req.user.populate({
            path:'tasks',
            match, //match:match
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                //sort:{
                    //createdAt: 1 //field we want to sort at. 1=>ascending and -1=>descending order 
                    //completed: 1
                //}
                sort //sort:sort
            }
        }).execPopulate()
        //2nd method:
        //const tasks = await Task.find({owner: req.user._id})
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(0)
    }
})

router.get('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id

    try{
        const task = await Task.findOne({_id,owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
    //OLD CODE==================================
    // Task.findById(_id).then((task)=>{
    //     if(!task){
    //         return res.status(404).send()
    //     }
    //     res.send(task)
    // }).catch((error)=>{
    //     res.status(500).send()
    // })
})

router.patch('/tasks/:id', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['completed','description']
    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){
        return res.status(400).send({error:'Invalid Updates!'})
    }

    try{
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})
        //const task = await Task.findById(req.params.id)
        const task = await Task.findOne({_id:req.params.id, owner:req.user._id})
        
        if(!task){
            return res.status(404).send()
        }

        updates.forEach((update)=> task[update]=req.body[update])

        await task.save()
        res.send(task)
    }catch(e){
        res.status(400).send()
    }
})

router.delete('/tasks/:id', auth, async (req, res)=>{
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

module.exports = router