import { Router } from "express";
import { appointDoctor, registerPatient } from "../controllers/receptionist.js";
import authenticateToken, { authorizeRoles } from "../middlewares/auth.js";

const receptionistRouter = Router();

receptionistRouter.post(
  "/patients",
  authenticateToken,
  authorizeRoles("receptionist", "admin"),
  registerPatient,
);

receptionistRouter.patch(
  "/patients/:patientId/appoint-doctor",
  authenticateToken,
  authorizeRoles("receptionist", "admin"),
  appointDoctor,
);

export default receptionistRouter;
