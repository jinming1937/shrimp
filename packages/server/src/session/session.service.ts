import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SessionService {
  getSessionsList() {
    const sessionsDir = path.resolve(__dirname, '../../../../.chat/sessions');
    try {
      if (!fs.existsSync(sessionsDir)) {
        return [];
      }
      const files = fs
        .readdirSync(sessionsDir)
        .filter((file) => file.endsWith('.json'));
      const sessions = files.map((file) => {
        const sessionId = path.parse(file).name;
        try {
          const filePath = path.join(sessionsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const messages = JSON.parse(content);
          const firstMessage = messages.length > 0 ? messages[0].text : '';
          return { id: sessionId, firstMessage };
        } catch (err) {
          console.error(`Error reading session ${sessionId}:`, err);
          return { id: sessionId, firstMessage: '' };
        }
      });
      return sessions.reverse(); // newest first
    } catch (err) {
      console.error('Error listing sessions:', err);
      return [];
    }
  }

  getSessionMessages(sessionId: string) {
    const sessionsDir = path.resolve(__dirname, '../../../../.chat/sessions');
    try {
      const filePath = path.join(sessionsDir, `${sessionId}.json`);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading session messages:', err);
      return [];
    }
  }
}
