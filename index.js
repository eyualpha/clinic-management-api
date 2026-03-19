import e from "express";
import cors from "cors";
import { PORT } from "./configs/env.js";
import connectDB from "./configs/mongodb.js";

const app = e();

app.use(e.json());
app.use(cors());
connectDB();

app.get("/", (req, res) => {
  res.send("Dental Clinic API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
