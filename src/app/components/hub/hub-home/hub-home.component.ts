import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import {ApiCallsService} from "../../../services/api-calls.service";
import {
  ICollabMessage, IComments,
  IFeatures,
  INewsFeed,
  INewsFeedFilter,
  INewsSelectedFilter,
  ISelectedFilter
} from "../model/hub.model";
import {AppStateService} from "../../../services/app-state.service";
import {IFooter, ISocialMedia, IUser} from "../../../models/common.model";
import {ICommunityDetails} from "../../../models/general-values.model";
import {IconProp} from "@fortawesome/fontawesome-svg-core";
import {ActivatedRoute, Router} from "@angular/router";
import {ReplaySubject, take, takeUntil} from "rxjs";
import {MenuItem, MessageService} from "primeng/api";
import {isPlatformBrowser} from "@angular/common";
import {WindowRefService} from "../../../services/window-ref.service";
import {TieredMenu} from "primeng/tieredmenu";

@Component({
  selector: 'app-hub-home',
  templateUrl: './hub-home.component.html',
  styleUrls: ['./hub-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HubHomeComponent implements OnInit, OnDestroy {
  userDetails: IUser;
  headerDetails: ICommunityDetails;
  homeDetails: ICommunityDetails;
  hubFeatures: IFeatures[];
  showFeatures = true;
  pageId = 'updates';
  collabMessages: ICollabMessage[];
  showEditDialog: boolean;
  currentMessage: ICollabMessage;
  currentCommentsParent: ICollabMessage;
  showNewMessage: boolean;
  commentsForMessages: IComments = {};
  currentComment: ICollabMessage;
  showEditCommentDialog: boolean;
  actionItems: MenuItem[];
  commentClicked: boolean;
  doAutoFocus: boolean;
  private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(private appApiService: ApiCallsService, private appStateService: AppStateService,
              private changeDetectionRef: ChangeDetectorRef, private activatedRoute: ActivatedRoute,
              private router: Router, private messageService: MessageService,
              @Inject(PLATFORM_ID) private platformId: any, private windowRef: WindowRefService) {
  }

  async ngOnInit() {
    const communityDetails = this.appStateService.communityDetails;
    this.homeDetails = communityDetails.find(item => item.id === 'updates') as ICommunityDetails;
    this.appApiService.getHubFeatures().pipe(take(1)).subscribe(val => {
      this.hubFeatures = val;
      this.changeDetectionRef.markForCheck();
    });

    this.userDetails = this.appStateService.userDetails;

    this.headerDetails = communityDetails.find(item => item.id === 'home') as ICommunityDetails;
    this.showFeatures = this.appStateService.showFeatures;
    this.getCollabMessages();
    this.changeDetectionRef.detectChanges();
  }

  goToSelection(feature: IFeatures) {
    const url = feature.link;
    this.appStateService.setSidebarOption(url);
    this.router.navigate([`/${url}`]);
  }

  closeFeatures() {
    this.showFeatures = false;
    this.appStateService.showFeatures = this.showFeatures;
  }

  async getCollabMessages() {
    this.appApiService.getHubMessages(this.pageId).pipe(take(1)).subscribe(collabMessages => {
      this.collabMessages = collabMessages.reverse();
      this.appStateService.getUserDetailsSub().pipe(takeUntil(this.destroyed$))
        .subscribe(async (userDetails: IUser) => {
          this.userDetails = userDetails;
          this.collabMessages = this.collabMessages.map(message => {
            return {...message, canUpdateOrDelete: this.userDetails.username === message.username}
          })
          this.changeDetectionRef.detectChanges();
        })
    });
  }

  getMessageWithLinks(messageDesc: string) {
    return messageDesc.replace(
      /(https?:\/\/)([^ ]+)/g,
      '<a target="_blank" class="link-color" href="$&">$2</a>'
    );
  }

  showNewMessageForm() {
    this.showNewMessage = !this.showNewMessage;
  }

  messageAdded(formValues: any, isEdit?: boolean) {
    this.getCollabMessages();
  }

  getNewOrUpdatedMessage(formValues: any, isEdit?: boolean, isComment?: boolean): ICollabMessage {
    return {
      date: new Date().toDateString(),
      title: formValues.title,
      description: formValues.message,
      creatorName: this.userDetails.name,
      id: isEdit ? formValues.id : Math.random().toString(),
      edited: !!isEdit,
      canUpdateOrDelete: true,
      username: this.userDetails.username,
      numberComments: 0,
      parentId: isComment ? this.currentComment.parentId : ''
    }
  }

  editMessage(message: ICollabMessage) {
    this.showEditDialog = true;
    this.currentMessage = message;
  }

  async deleteMessage(message: ICollabMessage, isComment?: boolean) {
    try {
      await this.appApiService.deleteMessage(message.id).toPromise();
      const messageToFilterFrom = isComment ? this.commentsForMessages[this.currentCommentsParent.id] : this.collabMessages;
      if (isComment) {
        this.commentsForMessages[this.currentCommentsParent.id] = messageToFilterFrom?.filter(item => item.id !== message.id);
        const currentCommentsTotal = this.currentCommentsParent.numberComments;
        this.currentCommentsParent.numberComments = currentCommentsTotal ? currentCommentsTotal - 1 : 0;
      } else {
        this.collabMessages = messageToFilterFrom?.filter(item => item.id !== message.id) as ICollabMessage[];
      }
      this.successMessage();
      this.changeDetectionRef.detectChanges();
    } catch (e) {
      this.errorMessage();
    }
  }

  async getComments(message: ICollabMessage, numberComments?: boolean) {
    this.currentCommentsParent = message;
    this.doAutoFocus = !numberComments;
    this.commentsForMessages[message.id] = await this.appApiService.getHubCommentsPerMessage(message.id).toPromise();
    this.commentsForMessages[message.id] = this.commentsForMessages[message.id]?.map(comment => {
      return {...comment, canUpdateOrDelete: this.userDetails.username === comment.username}
    })
    this.changeDetectionRef.markForCheck();
  }

  commentAdded(formValues: any, isEdit?: boolean) {
    this.currentCommentsParent = this.collabMessages.find(message => message.id === formValues.msgId) as ICollabMessage;
    this.getComments(this.currentCommentsParent)
    const newComment: ICollabMessage = this.getNewOrUpdatedMessage(formValues, isEdit);
    this.currentComment = isEdit ? {...this.currentComment, ...newComment} : this.currentComment;
    const currentCommentsTotal = this.currentCommentsParent.numberComments;
    this.currentCommentsParent.numberComments = isEdit ? currentCommentsTotal : currentCommentsTotal ? currentCommentsTotal + 1 : 1;
  }

  editComment(comment: ICollabMessage) {
    this.showEditCommentDialog = true;
    this.currentComment = comment;
  }

  closeComments(message: ICollabMessage) {
    // this.currentCommentsParent = {} as ICollabMessage;
    this.commentsForMessages[message.id] = undefined;
  }

  successMessage() {
    this.messageService.add({
      severity: 'success',
      summary: 'Delete Successful',
      detail: 'Your message has been deleted'
    });
  }

  errorMessage() {
    this.messageService.add({
      severity: 'error',
      summary: 'Network error',
      detail: 'Please try again after other time'
    });
  }

  showContext(cm: TieredMenu, event: MouseEvent, message: ICollabMessage, isComment?: boolean) {
    this.commentClicked = !!isComment;
    if (isComment) {
      this.currentCommentsParent = (this.collabMessages.find(parent => parent.id == message.parentId)) as ICollabMessage;
      this.currentComment = message;
    } else {
      this.currentMessage = message;
    }
    cm.toggle(event);
    event.stopPropagation();
  }

  setActionItems() {
    this.actionItems = [
      {
        label: 'Edit',
        icon: 'pi pi-fw pi-pencil',
        command: (event) => {
          if (this.commentClicked) {
            this.editComment(this.currentComment);
          } else {
            this.editMessage(this.currentMessage);
          }
        }
      },
      {
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        command: (event) => {
          const messageToDelete = this.commentClicked ? this.currentComment : this.currentMessage;
          this.deleteMessage(messageToDelete, this.commentClicked);
        }
      }
    ];
  }


  getArrayForCount(count: number) {
    return new Array(count);
  }

  clearQueryParam() {
    this.router.navigate([], {
      queryParams: {
        'tags': null,
        'category': null,
      },
      queryParamsHandling: 'merge'
    })
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
