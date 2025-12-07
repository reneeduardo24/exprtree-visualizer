import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  EventEmitter,
  Output,
} from '@angular/core';
import { Slide, SlideService } from '../../core/slide.service';

@Component({
  selector: 'app-presentation-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presentation-slider.component.html',
  styleUrls: ['./presentation-slider.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PresentationSliderComponent {
  slides: Slide[] = [];

  @Output() requestScrollToWorkspace = new EventEmitter<void>();

  constructor(private slideService: SlideService) {
    this.slides = this.slideService.getSlides();
  }

  triggerScrollToWorkspace(): void {
    this.requestScrollToWorkspace.emit();
  }
}
