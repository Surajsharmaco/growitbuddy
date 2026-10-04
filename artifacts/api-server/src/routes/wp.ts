import { Router, type IRouter } from "express";

// Retire legacy resolver URLs explicitly, without contacting WordPress or
// pretending that its external content is still connected.
const wpRouter: IRouter = Router();
wpRouter.use((_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(410).json({ error: "WordPress integration has been removed. Blogs are managed in the GrowitBuddy CMS." });
});
export default wpRouter;