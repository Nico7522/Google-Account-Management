import { Component, computed, effect, inject, input, OnInit } from '@angular/core';
import { CallbackService } from './callback-service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-callback',
  imports: [RouterModule],
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback implements OnInit {
  readonly #callBackService = inject(CallbackService)
  code = input.required<string>();
  status = computed(() => {
    if (this.#callBackService.tokens.isLoading()) {
      return 'loading';
    }
    if (this.#callBackService.tokens.value()?.response === 'error') {
      return 'error';
    }
    return 'success';
  })
  ngOnInit(): void {
    this.#callBackService.setCode(this.code())
  }
}
