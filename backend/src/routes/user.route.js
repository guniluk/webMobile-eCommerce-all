import express from "express";
import { signup } from "../controllers/user.controller.js";

const route = express.Router();

route.get("/signup", signup);

export default route;
