import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { AgentService } from './services/agent.service';
import { AgentRequestDto } from './dto/agent-request.dto';

@Controller('api/agent') // 接口路径：/api/agent
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // @Post() // POST 请求
  // async handleAgentRequest(@Body() dto: AgentRequestDto) {
  //   const result = await this.agentService.runAgent(dto.prompt);
  //   return {
  //     status: HttpStatus.OK,
  //     data: result,
  //   };
  // }
}