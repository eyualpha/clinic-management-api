import { configDotenv } from "dotenv";

configDotenv();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

export { PORT, JWT_SECRET, MONGODB_URI, EMAIL_USER, EMAIL_PASS };
