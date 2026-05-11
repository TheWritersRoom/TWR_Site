import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import projectsRouter from "./projects";
import collaboratorsRouter from "./collaborators";
import suggestionsRouter from "./suggestions";
import publishingRouter from "./publishing";
import searchRouter from "./search";
import pitchesRouter from "./pitches";
import exportRouter from "./export";
import adminRouter from "./admin";
import messagesRouter from "./messages";
import bookmarksRouter from "./bookmarks";
import versionsRouter from "./versions";
import ipProtectionRouter from "./ip-protection";
import reputationRouter from "./reputation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(messagesRouter);
router.use(bookmarksRouter);
router.use(searchRouter);
router.use(pitchesRouter);
router.use(publishingRouter);
router.use(versionsRouter);
router.use(ipProtectionRouter);
router.use(projectsRouter);
router.use(collaboratorsRouter);
router.use(suggestionsRouter);
router.use(exportRouter);
router.use(adminRouter);
router.use(reputationRouter);

export default router;
