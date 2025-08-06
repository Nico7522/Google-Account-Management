import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ErrorToast } from './shared/error/error-toast';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  imports: [RouterOutlet, FormsModule, ErrorToast],
})
export class App {
  protected title = 'MCP-Angular';
}
