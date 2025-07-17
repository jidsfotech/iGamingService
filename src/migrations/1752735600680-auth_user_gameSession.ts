import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthUserGameSession1752735600680 implements MigrationInterface {
    name = 'AuthUserGameSession1752735600680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`wins\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`game_session\` (\`id\` int NOT NULL AUTO_INCREMENT, \`startTime\` datetime NOT NULL, \`endTime\` datetime NOT NULL, \`winningNumber\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`player_selection\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NOT NULL, \`gameSessionId\` int NOT NULL, \`selectedNumber\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`player_selection\` ADD CONSTRAINT \`FK_966f830a23b4ae70d9df1300375\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`player_selection\` ADD CONSTRAINT \`FK_020fcfb972d3c85b3865155b453\` FOREIGN KEY (\`gameSessionId\`) REFERENCES \`game_session\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player_selection\` DROP FOREIGN KEY \`FK_020fcfb972d3c85b3865155b453\``);
        await queryRunner.query(`ALTER TABLE \`player_selection\` DROP FOREIGN KEY \`FK_966f830a23b4ae70d9df1300375\``);
        await queryRunner.query(`DROP TABLE \`player_selection\``);
        await queryRunner.query(`DROP TABLE \`game_session\``);
        await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
    }

}
