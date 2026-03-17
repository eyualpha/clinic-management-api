import e from "express";
import cors from "cors";
import { PORT } from "./configs/env.js";

const app = e();
app.use(e.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
