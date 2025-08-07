import { Component, inject } from '@angular/core';
import { McpService } from '../shared/services/MCP/mcp-service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly #mcpService = inject(McpService);
  serverInfo = this.#mcpService.serverInfo;
}
