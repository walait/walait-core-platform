import { MigrationInterface, QueryRunner } from "typeorm";

export class Add1750812213149 implements MigrationInterface {
    name = 'Add1750812213149'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" ADD "role_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "UQ_b23c65e50a758245a33ee35fda1" UNIQUE ("role_id")`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "UQ_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP COLUMN "role_id"`);
    }

}
