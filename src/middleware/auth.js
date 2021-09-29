const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try{    
        const token = req.header('Authorization').replace('Bearer ','') //to remove the Bearer word and get only the token
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const user = await User.findOne({_id:decoded._id, 'tokens.token':token}) //find the user associated with this token
        if(!user){
            throw new Error()
        }
        //if user is authenticated (token validated)
        req.token = token //the used token
        req.user = user
        next()

    } catch(e){
        res.status(401).send({error:'Please authenticate.'})
    }
}

module.exports = auth