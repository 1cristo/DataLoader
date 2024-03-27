public with sharing class CsvProcessor {
    @AuraEnabled
    public static String processUploadedFile(String contentDocumentId) {
        // Paso 1: Recuperar el archivo usando contentDocumentId
        ContentVersion cv = [
            SELECT VersionData, FileType 
            FROM ContentVersion 
            WHERE ContentDocumentId = :contentDocumentId 
            ORDER BY CreatedDate DESC 
            LIMIT 1
        ];
        
        // Asegúrate de que el archivo es un CSV antes de proceder
        if (cv.FileType != 'CSV') {
            return 'El archivo no es un CSV';
        }

        // Paso 2: Leer el contenido del archivo
        String content = cv.VersionData.toString();
        // Dividir el contenido en filas
        String[] rows = content.split('\n');
        
        // Paso 3: Convertir los datos de CSV a registros de Salesforce
        List<Account> accountsToUpsert = new List<Account>();
        for (Integer i = 1; i < rows.size(); i++) {
            String[] columns = rows[i].split(',');
            // Asume un CSV simple con Nombre y Sitio web del Account por ejemplo
            Account acc = new Account(
                Name = columns[0].trim(),
                Website = columns[1].trim()
            );
            // Agregar lógica de identificación para actualizaciones si es necesario
            accountsToUpsert.add(acc);
        }

        // Paso 4: Insertar o actualizar registros en Salesforce
        try {
            upsert accountsToUpsert;
        } catch (Exception e) {
            return 'Error al procesar los registros: ' + e.getMessage();
        }

        return 'Proceso completado con éxito. Registros procesados: ' + accountsToUpsert.size();
    }
}
