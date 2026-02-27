import { Router } from 'express';
import VerifyMiddleware from '../../../middlewares/verify.middleware.js';
import EventController from '../Controllers/events.controller.js';
class EventRoutes {

    constructor() {
        this.router = Router();
        this.controller = new EventController();

    }
    routes() {
        this.router.post('/', VerifyMiddleware, this.controller.Create);
        this.router.put('/', VerifyMiddleware, this.controller.Update);
        this.router.get('/', VerifyMiddleware, this.controller.Get);
        this.router.get('/:id', VerifyMiddleware, this.controller.Get);
        this.router.delete('/:id', VerifyMiddleware, this.controller.Delete);
        return this.router;
    }
}


export default EventRoutes;