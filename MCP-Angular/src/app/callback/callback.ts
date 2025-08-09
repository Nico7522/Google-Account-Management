import { Component, effect, inject, input, OnInit } from '@angular/core';
import { CallbackService } from './callback-service';

@Component({
  selector: 'app-callback',
  imports: [],
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback implements OnInit {
  readonly #callBackService = inject(CallbackService)
  code = input.required<string>();

  ngOnInit(): void {
    this.#callBackService.setCode(this.code())
  }
}
