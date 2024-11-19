public with sharing class ItRequestCalendarService {
    @AuraEnabled(cacheable=true)
    public static List<IT_Request__c> fetchAllITRequests(String individualRequested, String agency, String projectCode) {
        try {
            String query = 'SELECT Id, Name, Linked_IT_Request__r.Name, Supplier_Assignment__r.Name, ' +
                           'Contact__r.Name, Start_Date__c, Linked_IT_Request_Date__c, Agency__c, Type__c, ' +
                           'Supplier_Assignment__r.Project_Code__c ' +
                           'FROM IT_Request__c WHERE Status__c != \'Cancelled\' AND Start_Date__c != null ';
            
            if (String.isNotBlank(individualRequested)) {
                query += ' AND Contact__r.Name LIKE \'%' + String.escapeSingleQuotes(individualRequested) + '%\'';
            }
            if (String.isNotBlank(agency)) {
                query += ' AND Agency__c = \'' + String.escapeSingleQuotes(agency) + '\'';
            }
            if (String.isNotBlank(projectCode)) {
                query += ' AND Supplier_Assignment__r.Project_Code__c LIKE \'%' + String.escapeSingleQuotes(projectCode) + '%\'';
            }
            
            query += ' ORDER BY Name DESC';
            
            return Database.query(query);
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching IT requests: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<SelectOption> getPicklistValues(String objectName, String fieldName) {
        try {
            Schema.DescribeFieldResult fieldResult = Schema.getGlobalDescribe().get(objectName)
                                                            .getDescribe()
                                                            .fields.getMap()
                                                            .get(fieldName)
                                                            .getDescribe();
            List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
            List<SelectOption> options = new List<SelectOption>();
            for (Schema.PicklistEntry entry : picklistEntries) {
                options.add(new SelectOption(entry.getValue(), entry.getLabel()));
            }
            return options;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching picklist values: ' + e.getMessage());
        }
    }
}
