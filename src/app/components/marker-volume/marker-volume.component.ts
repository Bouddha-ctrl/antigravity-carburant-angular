import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-marker-volume',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marker-volume.component.html',
  styleUrl: './marker-volume.component.css'
})
export class MarkerVolumeComponent implements OnInit, OnDestroy {
  volume = signal(1000);
  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.volume.update(v => v + 1);
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
