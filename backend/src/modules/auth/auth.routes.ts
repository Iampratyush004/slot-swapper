import { Router } from "express";
import { handleLogin, handleSignup } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";
import { handleGetMe, handleUpdateMe } from "./me.controller";

export const authRouter = Router();

authRouter.post("/signup", handleSignup);
authRouter.post("/login", handleLogin);

// profile
authRouter.get("/me", requireAuth, handleGetMe);
authRouter.put("/me", requireAuth, handleUpdateMe);


