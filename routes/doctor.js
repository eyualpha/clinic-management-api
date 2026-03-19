import { Router } from "express";
import {
  addMedicalRecord,
  getPatientMedicalHistory,
  listDoctors,
} from "../controllers/doctor.js";
import authenticateToken, { authorizeRoles } from "../middlewares/auth.js";

const doctorRouter = Router();

doctorRouter.get(
  "/doctors",
  authenticateToken,
  authorizeRoles("receptionist", "admin", "doctor"),
  listDoctors,
);

doctorRouter.post(
  "/patients/:patientId/medical-records",
  authenticateToken,
  authorizeRoles("doctor", "admin"),
  addMedicalRecord,
);

doctorRouter.get(
  "/patients/:patientId/medical-records",
  authenticateToken,
  authorizeRoles("doctor", "admin"),
  getPatientMedicalHistory,
);

export default doctorRouter;
