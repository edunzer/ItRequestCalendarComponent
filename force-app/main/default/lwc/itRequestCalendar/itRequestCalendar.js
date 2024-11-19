import { LightningElement, track } from 'lwc';
import fetchAllITRequests from '@salesforce/apex/ItRequestCalendarService.fetchAllITRequests';
import getPicklistValues from '@salesforce/apex/ItRequestCalendarService.getPicklistValues';

export default class ItRequestCalendar extends LightningElement {
    @track assignments = [];
    @track allEvents = [];
    @track selectedEvent;

    // Filters
    @track selectedIndividualId = null;
    @track selectedAgency = null;
    @track selectedProjectCode = null;

    @track agencyOptions = [];

    connectedCallback() {
        this.fetchPicklistOptions('IT_Request__c', 'Agency__c', 'agencyOptions');
    }

    fetchPicklistOptions(objectName, fieldName, targetProperty) {
        getPicklistValues({ objectName, fieldName })
            .then(result => {
                this[targetProperty] = result.map(value => ({ label: value.label, value: value.value }));
            })
            .catch(error => {
                console.error(`Error fetching picklist values for ${fieldName}:`, error);
            });
    }

    applyFilters() {
        fetchAllITRequests({
            individualRequested: this.selectedIndividualId,
            agency: this.selectedAgency,
            projectCode: this.selectedProjectCode
        })
        .then(result => {
            this.assignments = result;
            this.prepareEvents();
        })
        .catch(error => {
            console.error('Error fetching IT Requests:', error);
        });
    }

    clearFilters() {
        this.selectedIndividualId = null;
        this.selectedAgency = null;
        this.selectedProjectCode = null;

        this.template.querySelector('[data-id="agencyComboBox"]').value = null;
        this.template.querySelector('[data-id="projectCodeInput"]').value = null;
        this.applyFilters();
    }

    prepareEvents() {
        this.allEvents = this.assignments.map(request => ({
            id: request.Id,
            title: request.Name,
            start: request.Start_Date__c,
            end: request.Linked_IT_Request_Date__c,
            supplierAssignmentName: request.Supplier_Assignment__r?.Name || '',
            projectCode: request.Supplier_Assignment__r?.Project_Code__c || '',
            agency: request.Agency__c || ''
        }));
    }

    closeModal() {
        this.selectedEvent = null;
    }
}
