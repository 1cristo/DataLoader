public with sharing class FetchSObjects {
    // Clase interna para representar las opciones de selección
    public class SelectOption implements Comparable {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String value;

        public SelectOption(String value, String label) {
            this.label = label;
            this.value = value;
        }

        public Integer compareTo(Object other) {
            SelectOption otherOption = (SelectOption)other;
            return this.label.compareTo(otherOption.label);
        }
    }

    // Método para obtener la lista de objetos disponibles
    @AuraEnabled(cacheable=true)
    public static List<SelectOption> getObjects() {
        List<SelectOption> options = new List<SelectOption>();
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        for (String objectName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult describe = globalDescribe.get(objectName).getDescribe();
            options.add(new SelectOption(objectName, describe.getLabel()));
        }
        // Ordena las opciones por label
        options.sort();
        return options;
    }

    // Método para obtener los campos de un objeto específico
    @AuraEnabled(cacheable=true)
    public static List<SelectOption> getFieldsOfObject(String objectApiName) {
        List<SelectOption> fieldOptions = new List<SelectOption>();
        try {
            // Obtener la descripción del objeto
            Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
            // Obtener los campos del objeto
            Map<String, Schema.SObjectField> fieldsMap = objDescribe.fields.getMap();
            for (String fieldName : fieldsMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();
                fieldOptions.add(new SelectOption(fieldName, fieldDescribe.getLabel()));
            }
        } catch (Exception e) {
            // Manejar cualquier excepción que pueda ocurrir durante el proceso de obtención de campos
            System.debug('Error al obtener campos del objeto: ' + e.getMessage());
        }
        return fieldOptions;
    }
}
