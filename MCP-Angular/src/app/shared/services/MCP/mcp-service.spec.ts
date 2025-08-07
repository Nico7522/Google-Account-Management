import { TestBed } from '@angular/core/testing';

import { McpService } from './mcp-service';

describe('McpService', () => {
  let service: McpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(McpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
