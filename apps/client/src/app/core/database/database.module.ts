import { NgModule } from '@angular/core';
import { UserService } from './user.service';
import { ListStore } from './storage/list/list-store';
import { FirestoreListStorage } from './storage/list/firestore-list-storage';
import { CraftingRotationService } from './crafting-rotation/crafting-rotation.service';
import { TeamService } from './team.service';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { WorkshopService } from './workshop.service';
import { TeamInviteService } from './team-invite.service';
import { CraftingRotationsFolderService } from './crafting-rotations-folder.service';
import { CustomLinksService } from './custom-links/custom-links.service';


@NgModule({
  imports: [
    AngularFirestoreModule
  ],
  providers: [
    WorkshopService,
    UserService,
    TeamInviteService,
    CustomLinksService,
    CraftingRotationService,
    CraftingRotationsFolderService,
    TeamService
  ]
})
export class DatabaseModule {
}
