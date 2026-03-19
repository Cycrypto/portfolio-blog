import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdeaImport } from './entity/idea-import.entity';
import { IdeaCandidate } from './entity/idea-candidate.entity';
import { IdeasService } from './service/ideas.service';
import { IdeaImportsController } from './controller/idea-imports.controller';
import { IdeaCandidatesController } from './controller/idea-candidates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IdeaImport, IdeaCandidate])],
  controllers: [IdeaImportsController, IdeaCandidatesController],
  providers: [IdeasService],
  exports: [IdeasService],
})
export class IdeasModule {}
