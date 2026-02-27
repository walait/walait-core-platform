import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "public_key_infrastructure" })
@Unique("uq_public_key_infrastructure_tax_id", ["taxId"])
export class PublicKeyInfrastructure {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "encripy_private_key_pem", type: "text" })
  encryptPkPem!: string;

  @Column({ name: "tax_id", length: 11 })
  @Index() // para búsquedas frecuentes
  taxId: string;

  @Column({ name: "certificate_signing_request", type: "text", nullable: true })
  certificateSigningRequest?: string;

  @Column({ name: "cert_x509", type: "text", nullable: true })
  certX509?: string;

  /** Fecha de expiración extraída del X.509 */
  @Column({ name: "cert_x509_expiration", type: "timestamptz", nullable: true })
  certX509Expiration?: Date;

  @Column({ name: "passphrase" })
  passphrase: string;
  @Column({ default: true })
  enabled: boolean;

  /** Auditoría */
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
