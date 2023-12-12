import { Router } from "express";
import * as auth from "../controllers/auth";
import { authorize } from "../middleware/auth";
export const router = Router();

router.post('/login', auth.employeeLogin);
router.post('/users',authorize, auth.createEmployeeAccount);
router.post('/users/signup-url', authorize, auth.sendEmployeeSignupLink);