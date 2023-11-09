import { Router } from "express";
import  * as usersController  from '../controllers/users'
const router = Router()
router.get('/:id', usersController.getUser)

export {router}