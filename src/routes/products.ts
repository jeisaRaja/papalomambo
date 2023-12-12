import { Router } from "express";
import * as productController from "../controllers/products";

const router = Router();

router.post('/', productController.createProduct);

export { router };