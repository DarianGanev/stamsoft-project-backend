import { seedVehicleData } from './vehicle-data.seed';

void seedVehicleData().catch((error) => {
  console.error(error);
  process.exit(1);
});
