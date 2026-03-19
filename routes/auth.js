import { Router } from "express";
import { bootstrapAdmin, login, signup } from "../controllers/auth.js";
import authenticateToken, { authorizeRoles } from "../middlewares/auth.js";

const authRouter = Router();

authRouter.post("/bootstrap-admin", bootstrapAdmin);
authRouter.post("/signup", authenticateToken, authorizeRoles("admin"), signup);
authRouter.post("/login", login);

export default authRouter;
