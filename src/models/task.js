const mongoose = require('mongoose')


const taskSchema = new mongoose.Schema({
    description:{
        type:String,
        trim:true,
        required:true
    },
    completed:{
        type:Boolean,
        default:false
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'User' //create a reference from this field to another model
    }
},{
    timestamps:true
}) 

const Task = mongoose.model('Task',taskSchema)

module.exports = Task