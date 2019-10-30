import { Vector2 } from '../../../core/tools/vector2';

export interface TradeNpc {
  id: number;
  coords?: Vector2;
  mapId?: number;
  zoneId?: number;
  areaId?: number;
}
