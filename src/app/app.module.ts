import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ButtonComponent } from './sidebar/button/button.component';
import { CardComponent } from './sidebar/card/card.component';
import { FormsModule } from '@angular/forms';
import { DoorComponent } from './sidebar/door/door.component';
import { DetailSelectComponent } from './sidebar/detail-select/detail-select.component';
import { WaypointComponent } from './sidebar/waypoint/waypoint.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    CanvasComponent,
    ButtonComponent,
    CardComponent,
    DoorComponent,
    DetailSelectComponent,
    WaypointComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
