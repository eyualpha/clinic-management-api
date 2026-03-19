import e from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import receptionistRouter from "./routes/receptionist.js";
import doctorRouter from "./routes/doctor.js";

function createApp() {
  const app = e();

  app.use(e.json());
  app.use(cors());

  app.get("/", (req, res) => {
    res.send("Dental Clinic API is running");
  });

  app.use("/api/auth", authRouter);
  app.use("/api", receptionistRouter);
  app.use("/api", doctorRouter);

  return app;
}

export default createApp;
