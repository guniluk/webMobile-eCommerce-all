import express from "express";
import { serve } from "inngest/express";
import {
  inngest,
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
} from "../config/inngest.js";

const router = express.Router();

// Inngest 이벤트 수신 및 비동기 워크플로우 처리 엔드포인트
router.use(
  "/",
  serve({
    client: inngest,
    functions: [syncUserCreation, syncUserUpdation, syncUserDeletion],
  }),
);

export default router;

