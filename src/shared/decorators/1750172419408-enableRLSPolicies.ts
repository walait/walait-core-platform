import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRLSPolicies1750172419408 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Habilitar RLS
    await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE "organization_memberships" ENABLE ROW LEVEL SECURITY;`);

    // Políticas para "users"
    await queryRunner.query(`
      CREATE POLICY user_tenant_access ON "users"
      USING (
        id = current_setting('app.user_id')::uuid
        OR current_setting('app.role', true) = 'superadmin'
      );
    `);

    // Políticas para "organizations"
    await queryRunner.query(`
      CREATE POLICY org_tenant_access ON "organizations"
      USING (
        id = current_setting('app.organization_id')::uuid
        OR current_setting('app.role', true) = 'superadmin'
      );
    `);

    // Políticas para "sessions"
    await queryRunner.query(`
      CREATE POLICY session_owner_access ON "sessions"
      USING (
        user_id = current_setting('app.user_id')::uuid
        OR current_setting('app.role', true) = 'superadmin'
      );
    `);

    // Políticas para "organization_memberships"
    await queryRunner.query(`
      CREATE POLICY membership_tenant_access ON "organization_memberships"
      USING (
        organization_id = current_setting('app.organization_id')::uuid
        OR current_setting('app.role', true) = 'superadmin'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS user_tenant_access ON "users";`);
    await queryRunner.query(`DROP POLICY IF EXISTS org_tenant_access ON "organizations";`);
    await queryRunner.query(`DROP POLICY IF EXISTS session_owner_access ON "sessions";`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS membership_tenant_access ON "organization_memberships";`,
    );

    await queryRunner.query(`ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;`);
    await queryRunner.query(`ALTER TABLE "organization_memberships" DISABLE ROW LEVEL SECURITY;`);
  }
}
