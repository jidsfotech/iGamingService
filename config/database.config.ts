export default () => ({
  database: {
    type: 'mysql',
    port: 3306,
    host:process.env.DATABASE_HOST,
    database:process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    // entities: [User],
    // synchronize: true,
    autoLoadEntities: true,
  },
});
