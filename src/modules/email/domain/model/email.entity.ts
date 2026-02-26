import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity({ name: 'emails' })
export class EmailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Index('')
  @Column({ unique: true })
  slug: string;
  @Column({ unique: true })
  external_id: string;
  @Column()
  subject: string;
  @Column({ type: 'boolean' })
  isActive: boolean;
  @Column({ type: 'jsonb' })
  sender: {
    name: string;
    email: string;
  };
  @Column()
  tag: string;
  @Column()
  htmlContent: string;
}
