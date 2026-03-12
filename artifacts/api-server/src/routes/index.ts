import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import projectsRouter from "./projects";
import collaboratorsRouter from "./collaborators";
import suggestionsRouter from "./suggestions";
import publishingRouter from "./publishing";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(searchRouter);
router.use(publishingRouter);
router.use(projectsRouter);
router.use(collaboratorsRouter);
router.use(suggestionsRouter);

export default router;
