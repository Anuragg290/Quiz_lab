import { mongodbClient } from '@/integrations/mongodb/client';

export const seedData = async () => {
  try {
    // Seed categories and questions
    await mongodbClient.seedData();
    console.log('Data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
