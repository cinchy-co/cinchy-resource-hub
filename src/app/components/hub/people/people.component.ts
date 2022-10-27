import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {AppStateService} from "../../../services/app-state.service";
import {ApiCallsService} from "../../../services/api-calls.service";
import {WindowRefService} from "../../../services/window-ref.service";
import {ICommunityDetails} from "../../../models/general-values.model";
import {IOptionHub, ITeam} from "../model/hub.model";

@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss']
})
export class PeopleComponent implements OnInit {
  headerDetails: ICommunityDetails;
  people: ITeam[] | any;
  teams: IOptionHub[];
  selectedTeam: IOptionHub;

  constructor(private appStateService: AppStateService, private appApiService: ApiCallsService,
              @Inject(PLATFORM_ID) private platformId: any, private windowRef: WindowRefService) {
  }

  async ngOnInit() {
    const communityDetails = this.appStateService.communityDetails;
    this.headerDetails = communityDetails.find(item => item.id === 'people') as ICommunityDetails;
    this.teams = await this.appApiService.getTeams().toPromise();
    this.teams.unshift({label: 'All'});
    this.getPeople();
  }

  async getPeople() {
    const param = this.selectedTeam?.label ? this.selectedTeam.label : '';
    this.people = await this.appApiService.getPeople(param).toPromise();
  }

  teamChanged() {
    this.selectedTeam = this.selectedTeam?.label === 'all' ? {label: ''} : this.selectedTeam;
    this.getPeople();
  }

  getArrayForCount(count: number) {
    return new Array(count);
  }

}
