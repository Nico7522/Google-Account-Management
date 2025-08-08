import { Component, effect, input } from '@angular/core';

@Component({
  selector: 'app-callback',
  imports: [],
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback {
  authCode = input.required<string>();

  constructor() {
    effect(() => {
      console.log(this.authCode());
    });
  }
}
