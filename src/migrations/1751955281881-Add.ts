import { MigrationInterface, QueryRunner } from "typeorm";

export class Add1751955281881 implements MigrationInterface {
    name = 'Add1751955281881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`CREATE TABLE "public_key_infrastructure" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "encripy_private_key_pem" text NOT NULL, "tax_id" character varying(11) NOT NULL, "certificate_signing_request" text, "cert_x509" text, "cert_x509_expiration" TIMESTAMP WITH TIME ZONE, "passphrase" character varying NOT NULL DEFAULT 'fVoRFWaH/0WwqT0U6XfD8faFQb67dvcphF4KQBMXU+g08SY8ceuc8+5Uc5wAOJ+zfh3RSCntlBVwDtLGw/SIafW5pjLEeVTgqhkNug==', "enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_public_key_infrastructure_tax_id" UNIQUE ("tax_id"), CONSTRAINT "PK_200ef5086ff75dd62cbf7747c2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_82033264166f413ddadcb58a51" ON "public_key_infrastructure" ("tax_id") `);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "UQ_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "UQ_b23c65e50a758245a33ee35fda1" UNIQUE ("role_id")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82033264166f413ddadcb58a51"`);
        await queryRunner.query(`DROP TABLE "public_key_infrastructure"`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
