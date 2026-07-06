import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { ProjectsModule } from '../projects/projects.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ConversationService } from './conversation.service';
import { BotFlowService } from './bot-flow.service';
import { BotNotificationService } from './bot-notification.service';

@Module({
  imports: [AuthModule, AiModule, ProjectsModule], // AuthModule → REDIS_CLIENT; AiModule → GeminiService; ProjectsModule → ProjectsService
  controllers: [WhatsappController],
  providers: [WhatsappService, ConversationService, BotFlowService, BotNotificationService],
})
export class WhatsappModule {}
