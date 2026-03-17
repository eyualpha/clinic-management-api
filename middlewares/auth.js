import jwt from "jsonwebtoken";
import { JWT_SECRET as secret } from "../configs/env.js";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid Token" });
  }
}

export default authenticateToken;
