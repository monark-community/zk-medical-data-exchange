import { Router } from "express";
import testRoutes from "./test";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.use("/test", testRoutes);

export default router;
