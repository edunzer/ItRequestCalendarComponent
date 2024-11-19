import { LightningElement, track, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import FullCalendarJS from '@salesforce/resourceUrl/FullCalendarJS';
import fetchAllITRequests from '@salesforce/apex/ItRequestCalendarService.fetchAllITRequests';
import getPicklistValues from '@salesforce/apex/ItRequestCalendarService.getPicklistValues';

export default class ItRequestCalendar extends LightningElement {
    @track assignments = [];
    @track allEvents = [];
    @track selectedEvent;
    @api projectName;

    // Filters
    @track selectedIndividualId = null;
    @track selectedAgency = null;
    @track selectedProjectCode = null;
    @track agencyOptions = [];

    fullCalendarJsInitialised = false;

    connectedCallback() {
        this.fetchPicklistOptions('IT_Request__c', 'Agency__c', 'agencyOptions');
    }

    renderedCallback() {
        if (this.fullCalendarJsInitialised) {
            return;
        }
        this.fullCalendarJsInitialised = true;

        Promise.all([
            loadScript(this, FullCalendarJS + '/jquery.min.js'),
            loadScript(this, FullCalendarJS + '/moment.min.js'),
            loadScript(this, FullCalendarJS + '/fullcalendar.min.js'),
            loadStyle(this, FullCalendarJS + '/fullcalendar.min.css')
        ])
            .then(() => {
                this.fetchITRequests();
            })
            .catch(error => {
                console.error('Error loading FullCalendar', error);
            });
    }

    fetchPicklistOptions(objectName, fieldName, targetProperty) {
        getPicklistValues({ objectName, fieldName })
            .then(result => {
                this[targetProperty] = result.map(value => ({ label: value, value }));
            })
            .catch(error => {
                console.error(`Error fetching picklist values for ${fieldName}:`, error);
            });
    }

    fetchITRequests() {
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
                console.error('Error fetching IT requests:', error);
            });
    }

    prepareEvents() {
        this.allEvents = this.assignments.map(request => {
            const startDate = request.Start_Date__c;
            const endDate = request.Linked_IT_Request_Date__c;
            const dateParts = endDate.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            date.setDate(date.getDate() + 1);
            const formattedEndDate = date.toISOString().split('T')[0];
    
            return {
                id: request.Id,
                title: request.Name,
                start: startDate,
                end: formattedEndDate,
                extendedProps: {
                    supplierAssignmentName: request.Supplier_Assignment__r?.Name || '',
                    projectCode: request.Supplier_Assignment__r?.Project_Code__c || '',
                    agency: request.Agency__c || ''
                }
            };
        });
        this.initialiseFullCalendarJs();
    }
    

    initialiseFullCalendarJs() {
        const ele = this.template.querySelector('.fullcalendarjs');
    
        if ($.fn.fullCalendar && $(ele).fullCalendar('getCalendar')) {
            $(ele).fullCalendar('destroy');
        }
    
        $(ele).fullCalendar({
            timezone: 'none',
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,basicWeek,basicDay,listWeek'
            },
            defaultDate: new Date(),
            navLinks: true,
            editable: false,
            eventLimit: true,
            events: this.allEvents,
            eventClick: this.eventClickHandler.bind(this)
        });
    }    

    // Event Handlers
    eventClickHandler(event) {
        if (event.start && event.end) {
            this.selectedEvent = {
                title: event.title,
                start: event.start,
                end: event.end,
                supplierAssignmentName: event.extendedProps.supplierAssignmentName,
                projectCode: event.extendedProps.projectCode,
                agency: event.extendedProps.agency
            };
        } else {
            console.error('Invalid event data:', event);
            this.selectedEvent = null;
        }
    }    

    handleIndividualChange(event) {
        this.selectedIndividualId = event.detail.recordId;
    }

    handleAgencyChange(event) {
        this.selectedAgency = event.detail.value;
    }

    handleProjectCodeChange(event) {
        this.selectedProjectCode = event.target.value;
    }

    applyFilters() {
        this.fetchITRequests();
    }

    clearFilters() {
        this.selectedIndividualId = null;
        this.selectedAgency = null;
        this.selectedProjectCode = null;

        const agencyComboBox = this.template.querySelector('[data-id="agencyComboBox"]');
        const projectCodeInput = this.template.querySelector('[data-id="projectCodeInput"]');

        if (agencyComboBox) {
            agencyComboBox.value = null;
        }
        if (projectCodeInput) {
            projectCodeInput.value = null;
        }

        this.fetchITRequests();
    }

    closeModal() {
        this.selectedEvent = null;
    }
}
