import { pdf } from "@react-pdf/renderer";
import { PayrollDocument } from "../utils/PdfGenerator";

self.onmessage = async (e) => {
    const data = e.data;

    const blob = await pdf(<PayrollDocument {...data} />).toBlob();

    self.postMessage(blob);
};  