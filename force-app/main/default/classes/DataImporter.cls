public with sharing class DataImporter {

    // Clase interna para la respuesta
    public class ImportResponse {
        @AuraEnabled
        public Integer totalImported {get; set;}
        public ImportResponse(Integer totalImported) {
            this.totalImported = totalImported;
        }
    }

    @AuraEnabled
    public static ImportResponse importCSVData(String csvDataString, String objectApiName) {
        // Deserializa la cadena JSON en una lista de mapas
        List<Map<String, String>> csvData = (List<Map<String, String>>) JSON.deserialize(csvDataString, List<Map<String, String>>.class);
        
        // Lista para contener los registros a ser insertados
        List<sObject> recordsToInsert = new List<sObject>();
        
        // Obtén el sObject correspondiente al nombre de la API
        Schema.SObjectType targetObjectType = Schema.getGlobalDescribe().get(objectApiName);
        
        // Verifica si el objeto es válido
        if (targetObjectType == null) {
            // Manejo de errores, el objeto no existe
            throw new MyCustomException('El objeto no existe.');
        }
        
        // Itera sobre cada registro en los datos del CSV
        for (Map<String, String> csvRecord : csvData) {
            // Crea una nueva instancia del sObject
            sObject newRecord = targetObjectType.newSObject();
            
            // Asigna los valores de los campos del CSV al sObject
            for (String fieldName : csvRecord.keySet()) {
                newRecord.put(fieldName, csvRecord.get(fieldName));
            }
            
            // Añade el sObject a la lista de registros a insertar
            recordsToInsert.add(newRecord);
        }

        // Intenta insertar los registros en Salesforce
        try {
            insert recordsToInsert; // Realiza la operación DML
        } catch (DmlException e) {
            // Manejo de errores si la inserción falla
            throw new MyCustomException('Error al insertar registros: ' + e.getMessage());
        }
        
        // Si todo salió bien, retorna el número de registros insertados
        return new ImportResponse(recordsToInsert.size());
    }
    
    // Clase para manejar excepciones personalizadas
    public class MyCustomException extends Exception {}
}
