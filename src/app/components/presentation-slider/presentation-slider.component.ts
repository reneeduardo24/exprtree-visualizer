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

  /** tiempo entre slides automáticos (ms) */
  private readonly autoSlideIntervalMs = 7000;
  private autoSlideId: ReturnType<typeof setInterval> | null = null;

  /** controla la clase de animación */
  animationActive = false;

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

  // --------- manejo del auto–slide ---------

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

  // --------- animación suave en cada cambio ---------

  private triggerAnimation(): void {
  // Removemos clase
  this.animationActive = false;

  // Dos frames para asegurar reinicio incluso si Angular no detecta cambios
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      this.animationActive = true;
    });
  });
}
}
