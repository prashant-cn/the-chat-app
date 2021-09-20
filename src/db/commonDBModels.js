const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


// to use a middleware like bcrypt we need to seprate the Schema first and then pass that into Model
const userSchema = new mongoose.Schema({
    name: {
        type: String, // counstruction functions from JavaScript as value of type
        required: true,
        default: 'Anonymous',
        trim: true, // More on mongoose docs SchemaTypes
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value, {yahoo_remove_subaddress:false})){
                throw new Error('Invalid Email')
            }
        }
    },
    password: {
        type: String,
        required: [true, 'Please enter a password.'],
        trim: true,
        minlength: [6, 'Password length must be greater than or equal to 6'],
        validate(value) {
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age must be a positive number.')
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required:true
        }
    }]
}, {
    timestamps: true
})

// virtual property - it's a relationship b/w two entitities
userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'userId'
})


// Hide critical data from response
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

//methods are accessible on instances 
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

// common login function attached to useSchema of user model // statics methods are accessible on Models
userSchema.statics.loginUser = async (email, password) => {
    const user = await User.findOne({ email })
    if(!user){
        throw new Error('Unable to login')
    }
    
    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Unable to login')
    }

    return user
}


//use a method on userSchema to set the middleware //hash the plain text password before saving
userSchema.pre('save', async function (next) { // normal function is used instead of arrow function to make use of this binding
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    
    next() // next is called to let the the fucntion know that asynchronous process is done
})

// delete user tasks when user is removed
userSchema.pre('remove', async function (next){
    const user = this
    await Tasks.deleteMany({ userId: user._id })
    next()
})

// defining User Model
const User = mongoose.model('User', userSchema)




// Defining Tasks Schema
const tasksSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    description: {
        type: String,
        required: true,
        trim: true

    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
//defining Tasks Model
const Tasks = mongoose.model('Tasks', tasksSchema)

module.exports = {
    User: User,
    Tasks: Tasks
}