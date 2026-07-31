import express from "express";
import {
  syncUser,
  handleClerkWebhook,
  getProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/sync", syncUser);
router.post("/webhook", handleClerkWebhook);
router.get("/me", getProfile);

export default router;
