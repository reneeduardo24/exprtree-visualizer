import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
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
  @ViewChild('swiperEl', { static: true }) swiperEl?: ElementRef<HTMLElement>;

  slides: Slide[] = [];

  @Output() requestScrollToWorkspace = new EventEmitter<void>();

  private touchStartX: number | null = null;
  private readonly swipeThreshold = 50; // px

  constructor(private slideService: SlideService) {
    this.slides = this.slideService.getSlides();
  }

  triggerScrollToWorkspace(): void {
    this.requestScrollToWorkspace.emit();
  }

  // ============ helpers para extraer TouchEvent ============

  private extractTouchEvent(raw: any): TouchEvent | null {
    if (!raw) return null;

    // Caso 1: ya es un TouchEvent
    if ('changedTouches' in raw) {
      return raw as TouchEvent;
    }

    // Caso 2: CustomEvent de Swiper -> detail.event
    const detail = (raw as any).detail;
    if (detail && detail.event && 'changedTouches' in detail.event) {
      return detail.event as TouchEvent;
    }

    return null;
  }

  // ============ swipe handlers ============

  onTouchStart(event: any): void {
    const touchEvent = this.extractTouchEvent(event);
    if (!touchEvent || !touchEvent.changedTouches?.length) {
      return;
    }

    this.touchStartX = touchEvent.changedTouches[0].clientX;
  }

  onTouchEnd(event: any): void {
    const touchEvent = this.extractTouchEvent(event);
    if (this.touchStartX === null || !touchEvent || !touchEvent.changedTouches?.length) {
      return;
    }

    const endX = touchEvent.changedTouches[0].clientX;
    const diffX = endX - this.touchStartX;

    const swiperInstance: any = (this.swiperEl?.nativeElement as any)?.swiper;
    if (!swiperInstance) {
      this.touchStartX = null;
      return;
    }

    if (Math.abs(diffX) > this.swipeThreshold) {
      if (diffX < 0) {
        swiperInstance.slideNext();
      } else {
        swiperInstance.slidePrev();
      }
    }

    this.touchStartX = null;
  }
}
