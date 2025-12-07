import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Slide, SlideService } from '../../core/slide.service';

@Component({
  selector: 'app-presentation-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presentation-slider.component.html',
  styleUrls: ['./presentation-slider.component.scss'],
})
export class PresentationSliderComponent implements OnInit, OnDestroy {
  slides: Slide[] = [];
  currentSlideIndex = 0;

  @Output() requestScrollToWorkspace = new EventEmitter<void>();

  /** auto slide */
  private readonly autoSlideIntervalMs = 7000;
  private autoSlideId: ReturnType<typeof setInterval> | null = null;

  /** animación */
  animationActive = false;

  /** swipe */
  private touchStartX: number | null = null;
  private readonly swipeThreshold = 50; // px

  constructor(private slideService: SlideService) {
    this.slides = this.slideService.getSlides();
  }

  ngOnInit(): void {
    this.startAutoSlide();
    this.triggerAnimation();
  }

  ngOnDestroy(): void {
    this.clearAutoSlide();
  }

  get currentSlide(): Slide {
    return this.slides[this.currentSlideIndex];
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
    this.restartAutoSlide();
    this.triggerAnimation();
  }

  prevSlide(): void {
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
    this.restartAutoSlide();
    this.triggerAnimation();
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlideIndex = index;
      this.restartAutoSlide();
      this.triggerAnimation();
    }
  }

  triggerScrollToWorkspace(): void {
    this.requestScrollToWorkspace.emit();
  }

  // --------- auto slide ---------

  private startAutoSlide(): void {
    this.clearAutoSlide();
    this.autoSlideId = setInterval(() => {
      this.nextSlide();
    }, this.autoSlideIntervalMs);
  }

  private clearAutoSlide(): void {
    if (this.autoSlideId !== null) {
      clearInterval(this.autoSlideId);
      this.autoSlideId = null;
    }
  }

  private restartAutoSlide(): void {
    this.startAutoSlide();
  }

  // --------- animación suave ---------

  private triggerAnimation(): void {
    this.animationActive = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.animationActive = true;
      });
    });
  }

  // --------- swipe en móvil ---------

  onTouchStart(event: TouchEvent): void {
    if (event.changedTouches.length > 0) {
      this.touchStartX = event.changedTouches[0].clientX;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null || event.changedTouches.length === 0) {
      return;
    }

    const endX = event.changedTouches[0].clientX;
    const diffX = endX - this.touchStartX;

    if (Math.abs(diffX) > this.swipeThreshold) {
      if (diffX < 0) {
        // swipe hacia la izquierda -> siguiente slide
        this.nextSlide();
      } else {
        // swipe hacia la derecha -> slide anterior
        this.prevSlide();
      }
    }

    this.touchStartX = null;
  }
}
