import { Syncdata } from "../../utils.js";
class NetworkStateHandler {
    constructor() {
        this.isOnline = false;
    }

    SetOnline() {
        if (!this.isOnline) {
            window.ononline
            this.isOnline = true;
            Syncdata();
        }
    }
    
    SetOffline() {
        this.isOnline = false;
    }
}


export default NetworkStateHandler;