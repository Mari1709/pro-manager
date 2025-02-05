import { handler, Router } from '../../utils/router'
import { userService } from '../../services/user'
import { auth } from '../middleware/auth'

export const router = new Router()

const _maxCookieAge = 1000*3600*24*60

router.post('/register', auth(), handler(({ body }) => {
    return userService.register(body)
}))

router.put('/:id', auth(), handler(({ params, body }) => {
    return userService.update({ id: params.id, ...body })
}))

router.post('/login', handler(async ({ res, body }) => {
    const token = await userService.login(body)
    console.log('token ', token)
    res.cookie(userService.getTokenKey(), token, { maxAge: _maxCookieAge })
    return token
}))

router.get('/auth/enabled', handler(() => {
    return userService.authEnabled()
}))

router.get('/', auth(), handler(() => {
    return userService.get()
}))

router.delete('/', auth(), handler(({ body }) => {
    return userService.remove(body.id)
}))