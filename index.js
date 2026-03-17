import e from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = e();
app.use(e.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
