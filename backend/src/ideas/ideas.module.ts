import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdeaImport } from './entity/idea-import.entity';
import { IdeaCandidate } from './entity/idea-candidate.entity';
import { IdeasService } from './service/ideas.service';
import { IdeaImportsController } from './controller/idea-imports.controller';
import { IdeaCandidatesController } from './controller/idea-candidates.controller';
import { AiImportsController } from './controller/ai-imports.controller';
import { AssistantSessionsController } from './controller/assistant-sessions.controller';
import { AssistantSession } from './entity/assistant-session.entity';
import { DraftGeneration } from './entity/draft-generation.entity';
import { WorkerGatewayService } from './service/worker-gateway.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IdeaImport,
      IdeaCandidate,
      AssistantSession,
      DraftGeneration,
    ]),
  ],
  controllers: [
    IdeaImportsController,
    IdeaCandidatesController,
    AiImportsController,
    AssistantSessionsController,
  ],
  providers: [IdeasService, WorkerGatewayService],
  exports: [IdeasService],
})
export class IdeasModule {}
