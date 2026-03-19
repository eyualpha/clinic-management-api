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

export function authorizeRoles(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Missing authenticated user" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Forbidden. You do not have permission to access this resource",
      });
    }

    next();
  };
}

export default authenticateToken;
