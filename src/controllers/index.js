import { Router } from '../utils/router'
import { auth } from './middleware/auth'
import cookieParser from 'cookie-parser'

export const mainRouter = new Router()

mainRouter.use(cookieParser())
mainRouter.use('/services/k8s', auth(), require('./k8s').router)
mainRouter.use('/services/install', require('./install').router)
mainRouter.use('/services/upgrade', auth(), require('./upgrade').router)
mainRouter.use('/services/manage', auth(), require('./manager').router)
mainRouter.use('/services/user', require('./user').router)
mainRouter.use('/services/version', require('./version').router)

mainRouter.use('/services/manage/configuration/mysql', auth(), require('./configuration/mysql').router)
mainRouter.use('/services/manage/configuration/redis', auth(), require('./configuration/redis').router)
mainRouter.use('/services/manage/configuration/data', auth(), require('./configuration/data').router)
mainRouter.use('/services/manage/configuration/domain', auth(), require('./configuration/domain').router)
mainRouter.use('/services/manage/configuration/mail', auth(), require('./configuration/mail').router)
mainRouter.use('/services/manage/configuration/k8s', auth(), require('./configuration/k8s').router)

mainRouter.use('/services/manage/loadbalancer/nginx', auth(), require('./manage/loadbalancer/nginx').router)
mainRouter.use('/services/manage/loadbalancer/ingress', auth(), require('./manage/loadbalancer/ingress').router)
mainRouter.use('/services/manage/cert', auth(), require('./manage/cert').router)

mainRouter.use('/health', require('./health').router)
