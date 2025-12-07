import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { PresentationSliderComponent } from './components/presentation-slider/presentation-slider.component';
import { WorkspaceComponent } from './components/workspace/workspace.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PresentationSliderComponent, WorkspaceComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('workspaceRef') workspaceEl?: ElementRef<HTMLElement>;

  scrollToWorkspace(): void {
    this.workspaceEl?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
