import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AgentService } from './services/agent.service';
import { AgentRequestDto } from './dto/agent-request.dto';
import { ISendExt, IProgressEvent, OnProgressCallback } from 'src/types';

@Controller('api/agent') // 接口路径：/api/agent
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  private sendSseEvent(res: Response, payload: any) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  private async saveAndEmitProgress(
    res: Response,
    sessionId: string,
    event: IProgressEvent,
  ) {
    const progressMessage = {
      id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: event.message,
      role: 'system' as const,
      ext: {
        type: 'thinking' as const,
        meta: {
          step: event.step,
          type: event.type,
          data: event.data,
        },
      },
    };

    if (event.persist !== false) {
      await this.agentService.saveMessage(sessionId, progressMessage);
    }

    this.sendSseEvent(res, progressMessage);
  }

  @Post('/chat')
  async handleChat(
    @Body() data: { message: string; sessionId: string; role: string; ext?: ISendExt },
    @Res() res: Response,
  ) {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const progressCallback: OnProgressCallback = async (event) => {
      await this.saveAndEmitProgress(res, data.sessionId, event);
    };

    try {
      // generate unique message id
      const userMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // store the user's message immediately
      await this.agentService.saveMessage(data.sessionId, {
        id: userMessageId,
        text: data.message,
        role: data.role as 'user',
        ext: data.ext,
      });

      await progressCallback({
        type: 'progress',
        step: 'save_message',
        message: '用户消息已保存。',
      });

      // generate a unique message ID for the bot response
      const botMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Send loading message
      this.sendSseEvent(res, {
        id: botMessageId,
        text: 'Loading...',
        role: 'system',
        isLoading: true,
      });

      // Process message
      const result = await this.agentService.onceAgent(
        {
          text: data.message,
          role: data.role as 'user',
          ext: data.ext || { type: 'text' },
        },
        data.sessionId,
        progressCallback,
      );

      let botText = '';
      let ext: ISendExt | undefined;

      if ('output_media' in result) {
        const mediaList = result.output_media as {
          content: Array<{
            image?: string;
            text?: string;
          }>;
          role: 'user' | 'assistant' | 'system';
        };
        const imageItem = mediaList.content.find((item) => item.image);
        const textItem = mediaList.content.find((item) => item.text);
        console.log('mediaList', mediaList);
        botText = textItem?.text || '';
        if (imageItem?.image) {
          await progressCallback({
            type: 'image',
            step: 'image_download_start',
            message: '开始下载图片结果。',
            data: { url: imageItem.image },
          });

          const filename = `generated-${Date.now()}.png`;
          await this.agentService.downloadImage(imageItem.image, filename);
          ext = { type: 'image_url', url: `/api/img/${filename}` };

          await progressCallback({
            type: 'image',
            step: 'image_download_complete',
            message: '图片下载完成。',
            data: { url: ext.url },
          });
        }
      } else {
        botText = result.output_text || '';
      }

      // Save bot message
      await this.agentService.saveMessage(data.sessionId, {
        id: botMessageId,
        text: botText,
        role: 'assistant',
        ext,
      });

      await progressCallback({
        type: 'progress',
        step: 'save_bot_message',
        message: '机器人消息已保存。',
      });

      console.log(botText.substring(0, 10) + '...');

      // Send final message
      this.sendSseEvent(res, {
        id: botMessageId,
        text: botText,
        role: 'assistant',
        ext,
      });

      res.end();
    } catch (err) {
      console.error('Error during chat:', err);
      const errorMessage = (err as any).message || 'Error occurred';
      const botMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Save error message
      await this.agentService.saveMessage(data.sessionId, {
        id: botMessageId,
        text: errorMessage,
        role: 'system',
      });

      // Send error message
      this.sendSseEvent(res, {
        id: botMessageId,
        text: errorMessage,
        role: 'system',
      });

      res.end();
    }
  }

  @Post('/text2voice')
  text2Voice(@Body() params: { text: string }) {
    return this.agentService.text2Voice(params.text);
  }

  @Post('/img2svg')
  img2SVG(@Body() params) {
    return this.agentService.img2SVG();
  }
}
