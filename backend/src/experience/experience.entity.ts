import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ExperienceType } from './experience.constants';
import { Project } from '../projects/project.entity';

@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'career' })
  type: ExperienceType;

  @Column()
  title: string;

  @Column()
  organization: string;

  @Column()
  startDate: string; // ISO string or YYYY-MM

  @Column({ type: 'character varying', nullable: true })
  endDate?: string | null; // nullable for current

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: true })
  resumeVisible: boolean;

  @Column({ type: 'integer', default: 0 })
  resumeOrder: number;

  @Column('text', { array: true, default: '{}' })
  resumeHighlights: string[];

  @OneToMany(() => Project, (project) => project.experience)
  projects?: Project[];
}
