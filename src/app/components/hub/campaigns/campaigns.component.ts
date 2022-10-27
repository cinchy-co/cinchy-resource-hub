import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {ICommunityDetails, PAGE_SIZE} from "../../../models/general-values.model";
import {ICampaigns, IEvents, IOptionHub} from "../model/hub.model";
import {isPlatformBrowser} from "@angular/common";
import {AppStateService} from "../../../services/app-state.service";
import {ApiCallsService} from "../../../services/api-calls.service";
import {WindowRefService} from "../../../services/window-ref.service";

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  headerDetails: ICommunityDetails;
  campaigns: ICampaigns[] | any;
  filteredCampaigns: ICampaigns[] | any;
  paginatedCampaigns: ICampaigns[] | any;
  currentPage = 0;
  pageSize = PAGE_SIZE + 4;
  campaignsStatus: IOptionHub[];
  selectedStatus: IOptionHub = {label: 'Active'};
  showLoader = true;

  constructor(private appStateService: AppStateService, private appApiService: ApiCallsService,
              @Inject(PLATFORM_ID) private platformId: any, private windowRef: WindowRefService) { }

  async ngOnInit() {
    const communityDetails = this.appStateService.communityDetails;
    this.headerDetails = communityDetails.find(item => item.id === 'campaigns') as ICommunityDetails;
    this.campaignsStatus = await this.appApiService.getCampaignStatus().toPromise();
    this.getCampaigns();
  }

  async getCampaigns() {
    this.showLoader = true;
    const param = this.selectedStatus?.label ? this.selectedStatus.label : '';
    this.campaigns = await this.appApiService.getCampaigns(param).toPromise();
    this.filteredCampaigns = this.campaigns;
    this.setPaginateData();
    this.showLoader = false;
  }

  goToSelection(option: ICampaigns) {
    const url = option.parentLink;
    if(isPlatformBrowser(this.platformId)) {
      this.windowRef.nativeWindow.open(url, '_blank');
    }
  }

  getArrayForCount(count: number) {
    return new Array(count);
  }

  paginate(event: any) {
    this.currentPage = event.page;
    this.setPaginateData();
  }

  setPaginateData() {
    const startPoint = this.currentPage * this.pageSize;
    const endPoint = startPoint + this.pageSize;
    this.paginatedCampaigns = [...this.filteredCampaigns].slice(startPoint, endPoint);
  }

  statusSelected(tag: IOptionHub) {
    if (this.selectedStatus.label === tag.label) {
      this.selectedStatus = {label: ''};
    } else {
      this.selectedStatus = tag;
    }
    this.getCampaigns();
  }

  isSelectedFilter(tag: { label: string }, labelKey?: string): boolean {
    return (this.selectedStatus.label === tag.label);
  }

}
