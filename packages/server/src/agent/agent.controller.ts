import { Controller, Post, Body } from '@nestjs/common';
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

  

  @Post('/text2voice')
  text2Voice(@Body() params: {text: string}) {
    return this.agentService.text2Voice(params.text);
  }

  @Post('img2svg')
  img2SVG(@Body() params) {
    return this.agentService.img2SVG();
  }
}