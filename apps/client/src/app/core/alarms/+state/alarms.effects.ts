import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import {
  AddAlarms, AddAlarmsAndGroup,
  AlarmGroupLoaded,
  AlarmsActionTypes,
  AlarmsCreated,
  AlarmsLoaded,
  AssignGroupToAlarm,
  CreateAlarmGroup,
  DeleteAlarmGroup,
  LoadAlarmGroup,
  RemoveAlarm,
  SetAlarms,
  SetGroups,
  UpdateAlarm,
  UpdateAlarmGroup
} from './alarms.actions';
import { bufferTime, catchError, debounceTime, distinctUntilChanged, filter, map, mapTo, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { AlarmsFacade } from './alarms.facade';
import { AuthFacade } from '../../../+state/auth.facade';
import { Alarm } from '../alarm';
import { AlarmsService } from '../alarms.service';
import { TeamcraftUser } from '../../../model/user/teamcraft-user';
import { AlarmGroupService } from '../alarm-group.service';
import { AlarmGroup } from '../alarm-group';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AlarmsEffects {

  @Effect()
  loadAlarms$ = this.actions$.pipe(
    ofType(AlarmsActionTypes.LoadAlarms),
    switchMap(() => this.authFacade.userId$),
    // We want to connect the observable only the first time, no need to reload as it's firestore.
    distinctUntilChanged(),
    switchMap((userId) => {
      return combineLatest([
        this.alarmsService.getByForeignKey(TeamcraftUser, userId),
        this.alarmGroupsService.getByForeignKey(TeamcraftUser, userId)
      ]);
    }),
    debounceTime(500),
    map(([alarms, groups]) => new AlarmsLoaded(alarms, groups))
  );

  @Effect({ dispatch: false })
  deleteAllAlarms$ = this.actions$.pipe(
    ofType(AlarmsActionTypes.DeleteAllAlarms),
    withLatestFrom(this.alarmsFacade.allAlarms$),
    switchMap(([, alarms]) => {
      return this.alarmsService.deleteAll(alarms);
    })
  );

  @Effect()
  loadAlarmGroup$ = this.actions$.pipe(
    ofType<LoadAlarmGroup>(AlarmsActionTypes.LoadAlarmGroup),
    switchMap((action) => {
      return this.alarmGroupsService.get(action.key).pipe(
        catchError(() => {
          const notFound = new AlarmGroup('', 0);
          notFound.notFound = true;
          return of(notFound);
        }),
        switchMap(group => {
          if (group.notFound || group.alarms.length === 0) {
            return of(new AlarmGroupLoaded(group, []));
          }
          return combineLatest(group.alarms.map(key => this.alarmsService.get(key))).pipe(
            map(alarms => {
              return new AlarmGroupLoaded(group, alarms);
            })
          );
        })
      );
    })
  );

  @Effect()
  addAlarmsToDatabase$ = this.actions$
    .pipe(
      ofType<AddAlarms>(AlarmsActionTypes.AddAlarms),
      withLatestFrom(this.authFacade.userId$),
      map(([action, userId]) => {
        return (<AddAlarms>action).payload.map(alarm => {
          return new Alarm({ ...alarm, userId: userId });
        });
      }),
      switchMap((alarms: Alarm[]) => {
        return combineLatest(
          alarms.map(alarm => {
            return this.alarmsService.add(alarm);
          })
        );
      }),
      map((alarms) => new AlarmsCreated(alarms.length))
    );

  @Effect()
  addAlarmsAndGroupToDatabase$ = this.actions$
    .pipe(
      ofType<AddAlarmsAndGroup>(AlarmsActionTypes.AddAlarmsAndGroup),
      withLatestFrom(this.authFacade.userId$, this.alarmsFacade.allAlarms$),
      switchMap(([{ payload, groupName }, userId, allAlarms]) => {
        const alreadyCreated = payload
          .map(alarm => allAlarms.find(a => a.itemId === alarm.itemId && a.nodeId === alarm.nodeId && a.fishEyes === alarm.fishEyes))
          .filter(a => !!a);
        const alarms = payload
          .filter(alarm => !allAlarms.some(a => a.itemId === alarm.itemId && a.nodeId === alarm.nodeId && a.fishEyes === alarm.fishEyes))
          .map(alarm => {
            return new Alarm({ ...alarm, userId: userId });
          });
        let res = combineLatest(
          alarms.map(alarm => {
            return this.alarmsService.add(alarm);
          })
        );
        if (alarms.length === 0) {
          res = of([]);
        }
        return res.pipe(
          switchMap(alarmKeys => {
            const newGroup = new AlarmGroup(groupName, 0);
            newGroup.userId = userId;
            newGroup.alarms = [...alarmKeys, ...alreadyCreated.map(a => a.$key)];
            return this.alarmGroupsService.add(newGroup).pipe(
              mapTo(alarmKeys)
            );
          })
        );
      }),
      map((alarms) => new AlarmsCreated(alarms.length))
    );


  @Effect({ dispatch: false })
  updateAlarmInDatabase$ = this.actions$
    .pipe(
      ofType(AlarmsActionTypes.UpdateAlarm),
      switchMap((action: UpdateAlarm) => this.alarmsService.update(action.alarm.$key, action.alarm))
    );

  @Effect({ dispatch: false })
  removeAlarmFromDatabase$ = this.actions$
    .pipe(
      ofType<RemoveAlarm>(AlarmsActionTypes.RemoveAlarm),
      withLatestFrom(this.alarmsFacade.allGroups$),
      switchMap(([action, groups]) => {
        const groupsToUpdate = groups.map(g => {
          const lengthBefore = g.alarms.length;
          g.alarms = g.alarms.filter(key => key !== action.id);
          return g.alarms.length !== lengthBefore ? g : null;
        }).filter(g => !!g);
        if (groupsToUpdate) {
          return combineLatest([
            this.alarmsService.remove(action.id),
            this.alarmGroupsService.setMany(groupsToUpdate)
          ]);
        }
        return this.alarmsService.remove(action.id);
      })
    );

  @Effect({ dispatch: false })
  setAlarmsInDatabase$ = this.actions$.pipe(
    ofType<SetAlarms>(AlarmsActionTypes.SetAlarms),
    switchMap((action) => {
      return this.alarmsService.setMany(action.alarms);
    })
  );

  @Effect({ dispatch: false })
  clearLocalstorageOnAlarmDelete$ = this.actions$
    .pipe(
      ofType(AlarmsActionTypes.RemoveAlarm),
      map((action: RemoveAlarm) => localStorage.removeItem(`played:${action.id}`))
    );

  @Effect({ dispatch: false })
  addGroupToDatabase$ = this.actions$.pipe(
    ofType<CreateAlarmGroup>(AlarmsActionTypes.CreateAlarmGroup),
    withLatestFrom(this.authFacade.userId$),
    switchMap(([action, userId]) => {
      const group = new AlarmGroup(action.name, action.index);
      group.alarms = action.initialContent;
      group.userId = userId;
      return this.alarmGroupsService.add(group);
    })
  );

  @Effect({ dispatch: false })
  deleteGroupFromDatabase = this.actions$.pipe(
    ofType(AlarmsActionTypes.DeleteAlarmGroup),
    switchMap((action: DeleteAlarmGroup) => {
      return this.alarmGroupsService.remove(action.id);
    })
  );

  @Effect({ dispatch: false })
  setGroupsInDatabase$ = this.actions$.pipe(
    ofType<SetGroups>(AlarmsActionTypes.SetGroups),
    switchMap((action) => {
      return this.alarmGroupsService.setMany(action.groups);
    })
  );

  @Effect({ dispatch: false })
  updateGroupInsideDatabase$ = this.actions$.pipe(
    ofType<UpdateAlarmGroup>(AlarmsActionTypes.UpdateAlarmGroup),
    withLatestFrom(this.alarmsFacade.allGroups$),
    switchMap(([action, groups]) => {
      const editedGroup = groups.find(group => group.$key === action.group.$key);
      return this.alarmGroupsService.set(editedGroup.$key, editedGroup);
    })
  );

  @Effect({ dispatch: false })
  saveAlarmGroupAssignment$ = this.actions$.pipe(
    ofType<AssignGroupToAlarm>(AlarmsActionTypes.AssignGroupToAlarm),
    withLatestFrom(this.alarmsFacade.allGroups$),
    switchMap(([action, groups]) => {
      const group = groups.find(g => g.$key === action.groupId);
      return this.alarmGroupsService.set(group.$key, group);
    })
  );

  @Effect({ dispatch: false })
  showAlarmsCreatedNotification$ = this.actions$.pipe(
    ofType(AlarmsActionTypes.AlarmsCreated),
    isPlatformBrowser(this.platform) ? bufferTime(300) : map(() => []),
    filter(actions => actions.length > 0),
    tap((creations: AlarmsCreated[]) => {
      const amount = creations.reduce((count, c) => {
        return count + c.amount;
      }, 0);
      const label = amount === 1
        ? this.translate.instant('ALARMS.Alarm_created')
        : this.translate.instant('ALARMS.Alarms_created', { amount: amount });
      this.message.success(label, {
        nzDuration: 2000
      });
    })
  );

  constructor(private actions$: Actions, private alarmsFacade: AlarmsFacade,
              private authFacade: AuthFacade, private alarmsService: AlarmsService,
              private alarmGroupsService: AlarmGroupService, private message: NzMessageService,
              private translate: TranslateService, @Inject(PLATFORM_ID) private platform: Object) {
  }

}