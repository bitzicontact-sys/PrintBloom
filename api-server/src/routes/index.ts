import { Router, type IRouter } from "express";
import healthRouter from "./health";
import noticesRouter from "./notices";
import productsRouter from "./products";
import servicesRouter from "./services";
import settingsRouter from "./settings";
import ordersRouter from "./orders";
import clientsRouter from "./clients";
import projectsRouter from "./projects";
import uploadRouter from "./upload";
import printPricingRouter from "./print-pricing";
import rawMaterialsRouter from "./raw-materials";

const router: IRouter = Router();

router.use(healthRouter);
router.use(noticesRouter);
router.use(productsRouter);
router.use(servicesRouter);
router.use(settingsRouter);
router.use(ordersRouter);
router.use(clientsRouter);
router.use(projectsRouter);
router.use(uploadRouter);
router.use(printPricingRouter);
router.use(rawMaterialsRouter);

export default router;
