import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IdeaCandidate } from './idea-candidate.entity';

export enum IdeaSourceType {
  CHATGPT = 'chatgpt',
}

export enum IdeaGeneratorMode {
  FALLBACK = 'fallback',
  WORKER = 'worker',
}

@Entity('idea_imports')
export class IdeaImport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: IdeaSourceType.CHATGPT })
  sourceType: IdeaSourceType;

  @Column()
  sourceTitle: string;

  @Column({ type: 'text' })
  sourceUrl: string;

  @Column()
  sourceFingerprint: string;

  @Column({ type: 'int' })
  messageCount: number;

  @Column()
  extractedAt: string;

  @Column({ type: 'int' })
  createdByUserId: number;

  @Column({ type: 'text', default: '' })
  summaryShort: string;

  @Column({ type: 'text', default: '' })
  summaryLong: string;

  @Column('text', { array: true, default: '{}' })
  keyPoints: string[];

  @Column('text', { array: true, default: '{}' })
  technicalTopics: string[];

  @Column('text', { array: true, default: '{}' })
  decisions: string[];

  @Column('text', { array: true, default: '{}' })
  openQuestions: string[];

  @Column('text', { array: true, default: '{}' })
  evidenceSnippets: string[];

  @Column({ type: 'text', nullable: true })
  continuationBrief: string | null;

  @Column({ default: IdeaGeneratorMode.FALLBACK })
  generator: IdeaGeneratorMode;

  @Column({ type: 'text', nullable: true })
  workerImportId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => IdeaCandidate, (candidate) => candidate.ideaImport)
  candidates?: IdeaCandidate[];
}
