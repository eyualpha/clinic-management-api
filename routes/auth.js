import { Router } from "express";
import {
  bootstrapAdmin,
  login,
  requestPasswordResetOtp,
  resetPassword,
  signup,
  verifyPasswordResetOtp,
} from "../controllers/auth.js";
import authenticateToken, { authorizeRoles } from "../middlewares/auth.js";

const authRouter = Router();

authRouter.post("/bootstrap-admin", bootstrapAdmin);
authRouter.post("/signup", authenticateToken, authorizeRoles("admin"), signup);
authRouter.post("/login", login);
authRouter.post("/password-reset/request-otp", requestPasswordResetOtp);
authRouter.post("/password-reset/verify-otp", verifyPasswordResetOtp);
authRouter.post("/password-reset/reset", resetPassword);

export default authRouter;
