import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent.controller';
import { AgentService } from './services/agent.service';
import { LlmService } from './services/llm.service';
import { AgentGateway } from './agent.gateway';
import { WeatherService } from './services/weather.service';

@Module({
  // imports: [ConfigModule.forRoot()], // 加载环境变量
  controllers: [AgentController],
  providers: [AgentService, LlmService, WeatherService, AgentGateway], // 注入 Service
  // exports: [AgentService], // 允许其他模块复用
})
export class AgentModule {}