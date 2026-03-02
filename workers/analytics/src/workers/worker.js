import HandlePayrollEvent from "./payroll.analytics.js";
import EVENT_TYPES from "../config/Event.types.js";

async function HandleEvent(event, dbClient) {
    switch (event.type) {
        case EVENT_TYPES.PAYROLL:
            await HandlePayrollEvent(event, dbClient);
            break;
        default:
            console.log("Unknown event type");
    }
}

export default HandleEvent;