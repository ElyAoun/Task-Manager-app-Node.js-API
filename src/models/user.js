const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({ //create model and specify fields with types
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique: true, //to not allow 2 users to have the same email
        required:true,
        trim:true,
        lowercase:true, //convert to lower case before saving
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        }
    },  
    password:{
        type:String,
        required:true,
        trim:true,
        minLength:7,
        validate(value){
            if (value.toLowerCase().includes('password')){
                throw new Error('Password  cannot contain "password"')
            }
        }
    },
    age:{
        type:Number,
        default: 0, //in case no value is provided
        validate(value){
            if (value<0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{ //array containing the tokens generated for the user
        token:{
            type:String,
            required:true
        }
    }]
},{
    timestamps:true //adding 2 fields: created at and updated at that save the time where the user was created and updated at
})

userSchema.virtual('tasks', { //creating a relationship between the 2 tables
    ref: 'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.toJSON = function(){ //hide important data: send the user back without password and tokens array
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function (){ //when we need to access 'this', we can't use arrow functions
    const user = this
    const token = jwt.sign({_id:user._id.toString() },process.env.JWT_SECRET)
    
    user.tokens = user.tokens.concat({token})
    await user.save() //save to the database

    return token
}

//method called in the router (for login)
userSchema.statics.findByCredentials = async (email, password)=>{
    const user = await User.findOne({email}) //email:email <=> finding a user by email given as argument

    if(!user){ //if there is no user having that email
        throw new Error('Unable to login')
    }
    //if email is found, we have now to check the password
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error('Unable to login')
    }
    return user //return the user if found
}



//use this to hash the password before saving
userSchema.pre('save', async function(next){ //do something before an event. use 'post' to do something after an event
    const user = this //this gives access to the user that is about to be saved
    
    if(user.isModified('password')){ //true when user is being created or password is being updates
        user.password = await bcrypt.hash(user.password,8) //hash the password
    }

    next()
}) 

// Delete user task when user is removed
userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({owner:user._id})
    next()
})

const User = mongoose.model('User',userSchema)


module.exports = User