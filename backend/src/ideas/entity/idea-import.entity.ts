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

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => IdeaCandidate, (candidate) => candidate.ideaImport)
  candidates?: IdeaCandidate[];
}
