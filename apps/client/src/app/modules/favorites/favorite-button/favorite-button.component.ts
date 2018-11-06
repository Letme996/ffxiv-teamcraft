import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AuthFacade } from '../../../+state/auth.facade';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-favorite-button',
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.less']
})
export class FavoriteButtonComponent implements OnInit {

  @Input()
  type: 'workshops' | 'lists';

  @Input()
  key: string;

  @Input()
  size: string;

  isFavorite$: Observable<boolean>;

  private favorites$ = this.authFacade.favorites$;

  constructor(private authFacade: AuthFacade) {
  }

  toggleFavorite(): void {
    this.authFacade.toggleFavorite(this.type, this.key);
  }

  ngOnInit(): void {
    this.isFavorite$ = this.favorites$.pipe(
      map(favorites => {
        return favorites[this.type].indexOf(this.key) > -1;
      })
    );
  }

}
