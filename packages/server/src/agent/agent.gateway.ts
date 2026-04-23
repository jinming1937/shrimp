import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AgentService } from './services/agent.service';
import { ISendExt } from 'src/types';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify allowed origins
  },
})
export class AgentGateway {
  constructor(private readonly agentService: AgentService) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { message: string; sessionId: string; role: string, ext: ISendExt },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    // generate unique message id
    const userMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // store the user's message immediately
    await this.agentService.saveMessage(data.sessionId, {
      id: userMessageId,
      text: data.message,
      role: data.role as 'user',
      ext: data.ext
    });

    // generate a unique message ID for the bot response
    const botMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // immediately send a loading message
    this.server.to(data.sessionId).emit('message', {
      message: {
        id: botMessageId,
        text: 'Loading...',
        role: 'system',
        isLoading: true,
      },
      sessionId: data.sessionId,
      clientId: client.id,
    });

    try {
      // const result = await this.agentService.runAgentByAct(data.message);
      const result = await this.agentService.onceAgent({
        text: data.message,
        role: data.role as 'user',
        ext: data.ext,
      }, data.sessionId);
      // console.log('Agent result:', result);
      // save the bot response as well
      let botText = '';
      let ext: ISendExt | undefined;
      if ('output_media' in result) {
        // 处理媒体
        const mediaList = result.output_media as Array<{ image: string }>;
        const filename = `generated-${Date.now()}.png`;
        await this.agentService.downloadImage(mediaList[0].image, filename);
        ext = { type: 'image_url', url: `/api/img/${filename}` };
        botText = '';
      } else {
        botText = result.output_text || '';
      }
      await this.agentService.saveMessage(data.sessionId, {
        id: botMessageId,
        text: botText,
        role: 'assistant',
        ext,
      });

      console.log(botText.substring(0, 10) + '...'); // log the beginning of the response for debugging
      // Broadcast the response back to the room, replacing the loading
      this.server.to(data.sessionId).emit('message', {
        message: { id: botMessageId, text: botText, role: 'assistant', ext },
        sessionId: data.sessionId,
        clientId: client.id,
      });
    } catch (err) {
      console.error('Error during OpenAI call:', err);
      await this.agentService.saveMessage(data.sessionId, {
        id: botMessageId,
        text: (err as any).message || 'Error occurred',
        role: 'system',
      });
      this.server.to(data.sessionId).emit('message', {
        message: {
          id: botMessageId,
          text: (err as any).message || 'Error occurred',
          role: 'system',
        },
        sessionId: data.sessionId,
        clientId: client.id,
      });
    }
  }

  @SubscribeMessage('joinSession')
  async handleJoinSession(
    @MessageBody() sessionId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    client.join(sessionId);
    // no longer send history via websocket, client will fetch via HTTP
    client.emit('joined', { sessionId });
  }
}
