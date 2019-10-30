import { AbstractExtractor } from './abstract-extractor';
import { Item } from '../../../../model/garland-tools/item';
import { ItemData } from '../../../../model/garland-tools/item-data';
import { Observable } from 'rxjs';
import { DataType } from '../data-type';
import { GarlandToolsService } from '../../../../core/api/garland-tools.service';

export class VenturesExtractor extends AbstractExtractor<number[]> {

  constructor(gt: GarlandToolsService) {
    super(gt);
  }

  isAsync(): boolean {
    return false;
  }

  getDataType(): DataType {
    return DataType.VENTURE;
  }

  protected canExtract(item: Item): boolean {
    return item.ventures !== undefined && item.ventures.length > 0;
  }

  protected doExtract(item: Item, itemData: ItemData): Observable<number[]> | number[] {
    return item.ventures;
  }

}
