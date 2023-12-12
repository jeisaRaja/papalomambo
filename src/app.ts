import express from "express";

import { router as usersRouter } from "./routes/users";
import { router as productsRouter } from "./routes/products"
import { router as authRouter} from "./routes/auth";

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.use('/api/v1/users', usersRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/auth', authRouter)

export { app };