import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { XivapiEndpoint, XivapiService } from '@xivapi/angular-client';
import { LazyDataService } from '../../../core/data/lazy-data.service';
import { TranslateService } from '@ngx-translate/core';
import { map, switchMapTo, tap } from 'rxjs/operators';
import { subMonths } from 'date-fns';

@Component({
  selector: 'app-mappy-dashboard',
  templateUrl: './mappy-dashboard.component.html',
  styleUrls: ['./mappy-dashboard.component.less']
})
export class MappyDashboardComponent {

  private static readonly IGNORED_NODES = [174];

  public loading = true;

  public reloader$ = new BehaviorSubject<void>(null);

  public onlyMissingNodes$ = new BehaviorSubject(false);

  public display$ = this.reloader$.pipe(switchMapTo(
    combineLatest([
      this.lazyData.data$,
      this.xivapi.getList('mappy/updates' as XivapiEndpoint, { staging: true }),
      this.xivapi.getList(`mappy/nodes` as XivapiEndpoint, { staging: true }),
      this.onlyMissingNodes$
    ]).pipe(
      map(([data, updates, gatheringPointsRegistry, onlyMissingNodes]) => {
        const acceptedMaps = Object.values<any>(data.nodes).map(n => n.map);
        return Object.values<any>(data.maps)
          .filter(m => {
            return acceptedMaps.includes(m.id);
          })
          .map(m => {
            const mapNodes = Object.entries<any>(data.nodes)
              .map(([id, n]) => ({ id: +id, ...n }))
              .filter(n => n.map === m.id && n.items.length > 0 && !this.lazyData.ignoredNodes.includes(n.id));
            const gatheringPoints = gatheringPointsRegistry[m.id] || [];
            return {
              ...m,
              updates: updates[m.id],
              old: {
                BNPC: updates[m.id]?.BNPC < subMonths(new Date(), 3).getTime() / 1000,
                Node: updates[m.id]?.Node < subMonths(new Date(), 3).getTime() / 1000
              },
              missingNodes: mapNodes.filter((node) => {
                return !MappyDashboardComponent.IGNORED_NODES.includes(node.id)
                  && !gatheringPoints.some(gatheringPoint => data.gatheringPointToNodeId[gatheringPoint] === node.id)
                  && node.items.some(i => i < 2000000);
              }).length
            };
          })
          .filter(m => {
            return !onlyMissingNodes || m.missingNodes > 0;
          });
      }),
      tap(() => this.loading = false)
    ))
  );

  constructor(private activatedRoute: ActivatedRoute, private xivapi: XivapiService,
              private lazyData: LazyDataService, public translate: TranslateService) {
  }

}
