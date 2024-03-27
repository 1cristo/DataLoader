public with sharing class DataUploader {
    @AuraEnabled
    public static Integer uploadData(List<SObject> records) {
        // Asegúrate de que el tipo de objeto y los campos sean correctos y existan.
        // Inserta los registros y maneja excepciones como límites de governor, etc.
        try {
            insert records;
            return records.size();
        } catch (Exception e) {
            // Log o manejo de la excepción según sea necesario
            throw new AuraHandledException('Error al cargar los datos: ' + e.getMessage());
        }
    }
}
