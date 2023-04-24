const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')

const Schema = mongoose.Schema 

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

// static signup method
userSchema.statics.signup = async function(email, password) {
    
    // validation
    if (!email || !password) {
        throw Error('All fields must be filled')
    }
    if (!validator.isEmail(email)) {
        throw Error('Email not valid')
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!validator.matches(password, passwordRegex)) {
    const errors = [];

    if (!validator.matches(password, /^(?=.*[a-z])/)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!validator.matches(password, /^(?=.*[A-Z])/)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!validator.matches(password, /^(?=.*\d)/)) {
        errors.push('Password must contain at least one number');
    }

    if (!validator.matches(password, /^(?=.*[@$!%*?&])/)) {
        errors.push('Password must contain at least one special character');
    }

    throw new Error(errors.join('\n'));
    }
    
    const exists = await this.findOne({ email })

    if (exists) {
        throw Error('Email already in use')
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = await this.create({ email, password: hash })

    return user
}

// static login method
userSchema.statics.login = async function(email, password) {
    
    if (!email || !password) {
        throw Error('All fields must be filled')
    }

    const user = await this.findOne({ email })
    if (!user) {
        throw Error('Invalid credentials')
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        throw Error('Invalid credentials')
    }

    return user
}

module.exports = mongoose.model('User', userSchema)