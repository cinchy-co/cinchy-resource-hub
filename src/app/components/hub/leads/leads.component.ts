import {ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {ICommunityDetails} from "../../../models/general-values.model";
import {ApiCallsService} from "../../../services/api-calls.service";
import {AppStateService} from "../../../services/app-state.service";
import {WindowRefService} from "../../../services/window-ref.service";
import {IOptionLead} from "../../../models/common.model";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss']
})
export class LeadsComponent implements OnInit {
  headerDetails: ICommunityDetails;
  fiscalYears: IOptionLead[];
  calendarMonths: IOptionLead[];
  leadForm: FormGroup;
  tableData: any;

  constructor(private appApiService: ApiCallsService, private appStateService: AppStateService, private fb: FormBuilder,
              private windowRef: WindowRefService, @Inject(PLATFORM_ID) private platformId: any,
              private changeDetectionRef: ChangeDetectorRef) {
  }

  async ngOnInit() {
    const communityDetails = this.appStateService.communityDetails;
    this.headerDetails = communityDetails.find(item => item.id === 'leads') as ICommunityDetails;
    /*this.fiscalYears = await this.appApiService.getFiscalYears().toPromise();
    this.calendarMonths = await this.appApiService.getCalendarMonths().toPromise();
    this.createForm();*/
    this.tableData = await this.appApiService.getLeads().toPromise();
  }

 /* createForm() {
    this.leadForm = this.fb.group(
      {
        fiscalYears: ['', [Validators.required]],
        calendarMonths: []
      }
    );
    this.changeDetectionRef.detectChanges();
  }*/

 /* async submit() {
    if (!this.leadForm.valid) {
      return;
    }
    const {calendarMonths, fiscalYears} = this.leadForm.value;
    console.log('111 val', calendarMonths, fiscalYears)
    const paramYear = fiscalYears ? fiscalYears.join() : '';
    const paramMonth = calendarMonths ? calendarMonths.join() : '';
    this.tableData = await this.appApiService.getLeads(paramYear, paramMonth).toPromise();
    console.log('1111 DATA', this.tableData);
  }*/
  getCols(tableFirstRow: any): string[] {
    return Object.keys(tableFirstRow);
  }
}
