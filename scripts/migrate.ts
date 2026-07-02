import { AppDataSource } from '../src/database/data-source';

async function runMigrations() {
  await AppDataSource.initialize();

  try {
    const migrations = await AppDataSource.runMigrations({
      transaction: 'each',
    });

    if (migrations.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const migration of migrations) {
      console.log(`Applied ${migration.name}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

runMigrations().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
