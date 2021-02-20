import { APP_INITIALIZER } from '@angular/core';
import { CraftingReplayService } from './modules/crafting-replay/crafting-replay.service';
import { MessagingService } from './core/messaging/messaging.service';
import { PacketCaptureTrackerService } from './core/electron/packet-capture-tracker.service';
import { GubalService } from './core/api/gubal.service';
import { RetainersService } from './core/electron/retainers.service';

export const APP_INITIALIZERS = [
  {
    provide: APP_INITIALIZER,
    useFactory: (craftingReplayService: CraftingReplayService) => {
      return () => {
        craftingReplayService.init();
      };
    },
    deps: [CraftingReplayService],
    multi: true
  },
  {
    provide: APP_INITIALIZER,
    useFactory: (messagingService: MessagingService) => {
      return () => {
        messagingService.init();
      };
    },
    deps: [MessagingService],
    multi: true
  },
  {
    provide: APP_INITIALIZER,
    useFactory: (service: PacketCaptureTrackerService) => {
      return () => {
        service.init();
      };
    },
    deps: [PacketCaptureTrackerService],
    multi: true
  },
  {
    provide: APP_INITIALIZER,
    useFactory: (service: GubalService) => {
      return () => {
        service.init();
      };
    },
    deps: [GubalService],
    multi: true
  },
  {
    provide: APP_INITIALIZER,
    useFactory: (service: RetainersService) => {
      return () => {
        service.init();
      };
    },
    deps: [RetainersService],
    multi: true
  }
];
