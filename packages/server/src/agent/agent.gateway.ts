import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AgentService } from './services/agent.service';


@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify allowed origins
  },
})
export class AgentGateway {

  constructor(private readonly agentService: AgentService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { message: string; sessionId: string; role: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    // generate unique message id
    const userMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // store the user's message immediately
    await this.agentService.saveMessage(data.sessionId, { id: userMessageId, text: data.message, role: data.role as 'user' });

    // generate a unique message ID for the bot response
    const botMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // immediately send a loading message
    this.server.to(data.sessionId).emit('message', {
      message: { id: botMessageId, text: 'Loading...', role: 'system', isLoading: true },
      sessionId: data.sessionId,
      clientId: client.id,
    });

    
    try {
      // const result = await this.agentService.runAgentByAct(data.message);
      const result = await this.agentService.onceAgent(data);
      // console.log('Agent result:', result);
      // save the bot response as well
      const botText = result.output_text || '';
      await this.agentService.saveMessage(data.sessionId, { id: botMessageId, text: botText, role: 'system' });

      console.log(botText.substring(0, 10) + '...'); // log the beginning of the response for debugging
      // Broadcast the response back to the room, replacing the loading
      this.server.to(data.sessionId).emit('message', {
        message: { id: botMessageId, text: botText, role: 'assistant' },
        sessionId: data.sessionId,
        clientId: client.id,
      });
    } catch (err) {
      console.error('Error during OpenAI call:', err);
      await this.agentService.saveMessage(data.sessionId, { id: botMessageId, text: 'ai response timeout', role: 'system' });
      this.server.to(data.sessionId).emit('message', {
        message: { id: botMessageId, text: 'ai response timeout', role: 'system' },
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