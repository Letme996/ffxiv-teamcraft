import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportComponent } from './import/import.component';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ListModule } from '../../modules/list/list.module';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { CoreModule } from '../../core/core.module';
import { PageLoaderModule } from '../../modules/page-loader/page-loader.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ItemIconModule } from '../../modules/item-icon/item-icon.module';
import { PipesModule } from '../../pipes/pipes.module';
import { FormsModule } from '@angular/forms';
import { ProgressPopupModule } from '../../modules/progress-popup/progress-popup.module';
import { ListPickerModule } from '../../modules/list-picker/list-picker.module';
import { MaintenanceGuard } from '../maintenance/maintenance.guard';
import { HttpClientModule } from '@angular/common/http';

const routes: Routes = [
  {
    path: ':importString',
    component: ImportComponent,
    canActivate: [MaintenanceGuard]
  }
];

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    RouterModule.forChild(routes),
    TranslateModule,
    ListModule,
    NgZorroAntdModule,
    FlexLayoutModule,
    ItemIconModule,
    PipesModule,
    ProgressPopupModule,
    ListPickerModule,
    HttpClientModule,

    PageLoaderModule
  ],
  declarations: [ImportComponent]
})
export class ImportModule {
}
