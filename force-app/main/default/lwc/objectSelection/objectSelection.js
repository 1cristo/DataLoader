import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getObjects from '@salesforce/apex/FetchSObjects.getObjects';
import getFieldsOfObject from '@salesforce/apex/FetchSObjects.getFieldsOfObject';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import importCSVData from '@salesforce/apex/DataImporter.importCSVData';


export default class ObjectSelection extends NavigationMixin(LightningElement) {
    @track showMapDataButton = false; 
    @track objectOptions = [];
    @track filteredObjects = [];
    selectedObject;
    searchTerm = '';
    showResults = false;
    disableNext = true;
    showObjectSelection = true;
    showCsvSelection = false;
    csvData = [];
    csvHeaders = [];
    showCsvTable = false;
    @track showMappingInterface = false;
    @track objectFields = [];
    @track csvFieldOptions = [];
    csvColumns = [];
    @track csvToSfFieldMapping = {}; // Nuevo mapeo para mantener relación CSV -> SF
    @track mappedDataDisplay = [];
    @track showMappedData = false; // Controla la visibilidad de la interfaz de datos mapeados
    @track isImporting = false;
    @track progressValue = 0; // Valor inicial de la barra de progreso




    @wire(getObjects)
    wiredObjects({ error, data }) {
        if (data) {
            this.objectOptions = data;
            this.filteredObjects = data; 
        } else if (error) {
            console.error('Error al recuperar objetos:', error);
        }
    }
    
    handleBack() {
        if (this.showCsvSelection) {
            // Si estamos en el paso 2, regresamos al paso 1
            this.showCsvSelection = false;
            this.showObjectSelection = true;
        } else if (this.showMappingInterface) {
            // Si estamos en el paso 3, regresamos al paso 2
            this.showMappingInterface = false;
            this.showCsvSelection = true;
        }
    }
    handleCancel() {
        this.showMappingInterface = false;
    }
    
    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.filteredObjects = this.objectOptions.filter(obj =>
            obj.label.toLowerCase().includes(this.searchTerm));
        this.showResults = this.filteredObjects.length > 0;
        this.disableNext = !this.showResults;
    }

    handleObjectSelection(event) {
        this.selectedObject = event.currentTarget.dataset.value;
        this.searchTerm = this.selectedObject;
        this.showResults = false;
        this.disableNext = false;
        this.updateObjectFields();
    }

    updateObjectFields() {
        getObjectFieldsFromServer(this.selectedObject)
            .then(result => {
                if (result) {
                    this.objectFields = result.map(field => ({
                        apiName: field.apiName,
                        label: field.label,
                        isPresent: true 
                    }));
                }
            })
            .catch(error => {
                console.error('Error al obtener campos del objeto:', error);
            });
    }

    handleNext() {
        this.showObjectSelection = false;
        this.showCsvSelection = true;
    }

    handleFileUpload(event) {
        const selectedFile = event.target.files[0];
        if (!selectedFile) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsedData = this.parseCSV(reader.result);
                if (parsedData && parsedData.length > 0) {
                    this.csvData = parsedData;
                    this.csvHeaders = Object.keys(parsedData[0]);
                    this.csvColumns = this.csvHeaders.map(header => ({
                        label: header,
                        fieldName: header,
                        type: 'text'
                    }));
                    this.showCsvTable = true;
                    this.showMapDataButton = true;
                }
            } catch (error) {
                console.error('Error al procesar el archivo CSV:', error);
            }
        };
        reader.onerror = () => {
            console.error('Error al leer el archivo.');
        };
        // Especifica UTF-8 como la codificación al leer el archivo
    reader.readAsText(selectedFile, 'UTF-8');
    }

    parseCSV(csvString) {
        const lines = csvString.split('\n');
        const result = [];
        const headers = lines[0].split(',');
        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentLine = lines[i].split(',');
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentLine[j];
            }
            result.push(obj);
        }
        return result;
    }

    handleMappingChange(event) {
        const apiName = event.target.dataset.apiName;
        const selectedValue = event.target.value;
        const csvHeader = event.target.dataset.csvHeader;
        const selectedFieldApiName = event.target.value;
        
        // Actualizar el mapeo CSV a campo de Salesforce
        this.csvToSfFieldMapping[csvHeader] = selectedFieldApiName;
        const fieldIndex = this.objectFields.findIndex(field => field.apiName === apiName);
        if (fieldIndex !== -1) {
            this.objectFields[fieldIndex].mappedValue = selectedValue;
        }
    }

    
    finalizeMapping() {
        // Validar que todos los encabezados CSV tengan un campo de Salesforce mapeado
        const allHeadersMapped = this.csvHeaders.every(header => this.csvToSfFieldMapping[header]);
        if (!allHeadersMapped) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Todos los encabezados CSV deben ser mapeados a un campo de Salesforce.',
                    variant: 'error',
                }),
            );
            return;
        }
    
        // Actualizar la información para mostrar
        this.mappedDataDisplay = this.csvHeaders.map(header => ({
            csvHeader: header,
            sfField: this.csvToSfFieldMapping[header]
        }));
    
        console.log('Mapeo finalizado:', this.csvToSfFieldMapping);
        // Notifica al usuario que el mapeo ha finalizado con éxito
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Mapeo Finalizado',
                message: 'La información mapeada está lista para ser revisada.',
                variant: 'success',
            }),
        );

        this.showCsvSelection = false; // por si

        this.showMappingInterface = false; // Cierra la interfaz de mapeo
        this.showMappedData = true; // Muestra la interfaz de datos mapeados
    }
    
    closeMappedDataView() {
        this.showMappedData = false;
        // Aquí puedes optar por regresar al usuario a un paso anterior o reiniciar el proceso completamente
        // Por ejemplo, para reiniciar podrías hacer:
        this.showObjectSelection = true; // Muestra de nuevo el primer paso
        // Asegúrate de reiniciar cualquier otra variable de estado necesaria
    }

    
    openMappingInterface() {
        this.showMappingInterface = true;
    }
    get mappedFields() {
        return this.csvHeaders.map(header => ({
            header: header,
            mappedField: this.csvToSfFieldMapping[header] || 'Unmapped'
        }));
    }
    startImport() {
        this.isImporting = true;
        // Asegúrate de ajustar la llamada según cómo tu método Apex espera recibir los datos
        const csvDataAsString = JSON.stringify(this.csvData); // Serializa los datos del CSV si es necesario
        importCSVData({ csvDataString: csvDataAsString, objectApiName: this.selectedObject })
            .then(result => {
                this.isImporting = false;
                this.showSuccessMessage(result); // Muestra un mensaje con el resultado
                this.progressValue = 100; // Ajusta el valor de progreso según sea necesario
            })
            .catch(error => {
                this.isImporting = false;
                this.showError(error); // Manejar el error
                this.progressValue = 0; // Restablecer la barra de progreso en caso de error
            });
    }
    
    importDataToSalesforce() {
        return new Promise((resolve, reject) => {
            // Llama a la función Apex para realizar la importación
            // Supongamos que la función Apex se llama `importCSVData` y está en `DataUploader` clase
            importCSVData({ csvData: this.csvData, objectApiName: this.selectedObject })
                .then(result => {
                    resolve(result); // Devuelve el resultado de la importación
                })
                .catch(error => {
                    reject(error); // Devuelve el error
                });
        });
    }
    
    showSuccessMessage(result) {
        // Muestra un mensaje de éxito con la cantidad de registros importados
        this.dispatchEvent(new ShowToastEvent({
            title: 'Importación Completada',
            message: `Se han importado ${result.totalImported} registros exitosamente.`,
            variant: 'success'
        }));
    }
    
    showError(error) {
        // Muestra un mensaje de error
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error en la Importación',
            message: error.message,
            variant: 'error'
        }));
    }

    

}

function getObjectFieldsFromServer(objectApiName) {
    return new Promise((resolve, reject) => {
        getFieldsOfObject({ objectApiName: objectApiName })
            .then(result => {
                resolve(result);
            })
            .catch(error => {
                console.error('Error al obtener campos del objeto:', error);
                reject(error);
            });
    });
}

