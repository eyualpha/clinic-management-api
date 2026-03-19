import { PORT } from "./configs/env.js";
import connectDB from "./configs/mongodb.js";
import createApp from "./app.js";

const app = createApp();
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
