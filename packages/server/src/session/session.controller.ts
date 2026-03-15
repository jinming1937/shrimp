import { Controller, Get, Param } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('/api/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}
  @Get('/list')
  getSessionsList() {
    return this.sessionService.getSessionsList();
  }

  @Get('/:sessionId/messages')
  getSessionMessages(@Param('sessionId') sessionId: string) {
    return this.sessionService.getSessionMessages(sessionId);
  }
}
