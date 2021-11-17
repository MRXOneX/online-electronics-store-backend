const ApiError = require('../error/ApiError')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {User, Basket} = require('../models/models')

const generateJwt = (id, email, role) => {
    return jwt.sign({id: id, email: email, role: role}, process.env.SECRET_KEY, {expiresIn: '24h'})
}

class UserController {
    async register(req, res, next) {
        const {email, password, role} = req.body
        if (!email || !password) return next(ApiError.badRequest('Некорректный email или password'))

        const candidate = await User.findOne({where: {email}})
        if (candidate) return next(ApiError.badRequest('Пользователь с таким email уже существует'))

        const hasPassword = await bcrypt.hash(password, 5)
        const user = await User.create({email, role, password: hasPassword})
        await Basket.create({userId: user.id})
        const token = generateJwt(user.id, user.email, user.role)

        return res.json({token})
    }

    async login(req, res, next) {
        const {email, password} = req.body
        const user = await User.findOne({where: {email}})
        if (!user) return next(ApiError.badRequest('Такого пользователя нет'))

        let comparePassword = bcrypt.compareSync(password, user.password)
        if (!comparePassword) return next(ApiError.badRequest('Пароль указан неверно'))

        const token = generateJwt(user.id, user.email, user.role)
        return res.json({token})
    }

    async auth(req, res) {
        const token = generateJwt(req.user.id, req.user.email, req.user.role)
        res.json({token})
    }
}

module.exports = new UserController()