// csvUploader.js
import { LightningElement, api } from 'lwc';

export default class CsvUploader extends LightningElement {
    @api recordId;

    handleUploadFinished(event) {
        // Maneja el evento de finalización de la subida
        // Puedes invocar aquí un método Apex para procesar el archivo subido
        console.log('Número de archivos subidos : ' + event.detail.files.length);
        // Invocar a Apex para procesar el archivo, pasando el ContentDocumentId del archivo subido
        // Por ejemplo: this.processCsvFile(event.detail.files[0].documentId);
    }
}
