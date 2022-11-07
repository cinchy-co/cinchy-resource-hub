import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {ApiCallsService} from "../../../services/api-calls.service";
import {ITables, ITools} from "../model/hub.model";
import {AppStateService} from "../../../services/app-state.service";
import {ICommunityDetails} from "../../../models/general-values.model";
import {Router} from "@angular/router";
import {isPlatformBrowser} from "@angular/common";
import {WindowRefService} from "../../../services/window-ref.service";

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  tools: ITables[];
  toolsHeaderDetails: ICommunityDetails;

  constructor(private appApiService: ApiCallsService, private appStateService: AppStateService,
              private router: Router, private windowRef: WindowRefService, @Inject(PLATFORM_ID) private platformId: any) {
  }

  async ngOnInit() {
    const communityDetails = this.appStateService.communityDetails;
    this.toolsHeaderDetails = communityDetails.find(item => item.id === 'reports') as ICommunityDetails;
    this.tools = await this.appApiService.getHubDashboards().toPromise();
  }

  goToSelection(item: ITables) {
    if(isPlatformBrowser(this.platformId)) {
      const url = item.tableLink
      this.windowRef.nativeWindow.open(url, '_blank');
    }
//    this.router.navigate([`tools/${item.toolRoute}`]);
  }

}
