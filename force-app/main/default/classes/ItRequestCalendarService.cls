public with sharing class ItRequestCalendarService {
    @AuraEnabled(cacheable=true)
    public static List<IT_Request__c> fetchAllITRequests(String individualRequested, String agency, String projectCode) {
        try {
            String query = 'SELECT Id, Name, Linked_IT_Request__r.Name, Supplier_Assignment__r.Name, ' +
                           'Contact__r.Name, Start_Date__c, Linked_IT_Request_Date__c, Agency__c, Type__c, ' +
                           'Supplier_Assignment__r.Project_Code__c ' +
                           'FROM IT_Request__c WHERE Status__c != \'Cancelled\' AND Start_Date__c != null AND Type__c = \'External\' ';
            
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
    public static List<String> getPicklistValues(String objectName, String fieldName) {
        try {
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
            Schema.DescribeSObjectResult describeSObjectResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fields = describeSObjectResult.fields.getMap();
            Schema.DescribeFieldResult fieldResult = fields.get(fieldName).getDescribe();
            List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();

            List<String> picklistValues = new List<String>();
            for (Schema.PicklistEntry entry : picklistEntries) {
                if (entry.isActive()) {
                    picklistValues.add(entry.getValue());
                }
            }

            return picklistValues;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch picklist values. Please contact admin.');
        }
    }

}
