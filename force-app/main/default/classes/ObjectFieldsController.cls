public with sharing class ObjectFieldsController {
    
    @AuraEnabled(cacheable=true)
    public static List<String> getObjectFields(String objectApiName) {
        List<String> fieldNames = new List<String>();
        
        // Obtener el objeto de descripción del objeto
        Schema.DescribeSObjectResult objectDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        
        // Obtener los campos del objeto
        Map<String, Schema.SObjectField> fieldMap = objectDescribe.fields.getMap();
        
        // Iterar sobre los campos y obtener sus nombres
        for(String fieldName : fieldMap.keySet()) {
            fieldNames.add(fieldName);
        }
        
        return fieldNames;
    }
}
