import { db } from './db';
import { clients } from '@shared/schema';

async function seedDatabase() {
  console.log('Seeding database...');
  
  try {
    // Check if clients table already has data
    const existingClients = await db.select().from(clients);
    
    if (existingClients.length > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }
    
    // Sample clients data with projects integrated
    const sampleClients = [
      {
        name: "TechVision Inc.",
        contactName: "Jonathan Chen",
        contactTitle: "CEO",
        email: "jonathan@techvision.example",
        phone: "+1 (555) 123-4567",
        industry: "Technology",
        status: "Discovery",
        websiteUrl: "https://techvision.example",
        projectName: "Website Redesign",
        projectDescription: "Complete overhaul of corporate website",
        projectStatus: "active",
        projectStartDate: new Date("2023-02-15"),
        projectValue: 45000,
        lastContact: new Date(),
        createdAt: new Date(),
      },
      {
        name: "Greenleaf Solutions",
        contactName: "Sarah Johnson",
        contactTitle: "Marketing Director",
        email: "sarah@greenleaf.example",
        phone: "+1 (555) 234-5678",
        industry: "Sustainability",
        status: "Planning",
        websiteUrl: "https://greenleaf.example",
        projectName: "Sustainability Report Website",
        projectDescription: "Interactive web presentation of annual sustainability report",
        projectStatus: "active",
        projectStartDate: new Date("2023-05-01"),
        projectValue: 30000,
        lastContact: new Date(),
        createdAt: new Date(),
      },
      {
        name: "Horizon Media Group",
        contactName: "Marcus Taylor",
        contactTitle: "Creative Director",
        email: "marcus@horizonmedia.example",
        phone: "+1 (555) 345-6789",
        industry: "Media",
        status: "Design and Development",
        websiteUrl: "https://horizonmedia.example",
        projectName: "Digital Content Platform",
        projectDescription: "New content management system for media distribution",
        projectStatus: "active",
        projectStartDate: new Date("2023-04-01"),
        projectValue: 55000,
        lastContact: new Date(),
        createdAt: new Date(),
      },
      {
        name: "BlueWave Analytics",
        contactName: "Priya Sharma",
        contactTitle: "CTO",
        email: "priya@bluewave.example",
        phone: "+1 (555) 456-7890",
        industry: "Data Analytics",
        status: "Post Launch Management",
        websiteUrl: "https://bluewave.example",
        projectName: "Data Visualization Tool",
        projectDescription: "Interactive data visualization tool",
        projectStatus: "completed",
        projectStartDate: new Date("2022-09-01"),
        projectEndDate: new Date("2023-02-28"),
        projectValue: 40000,
        lastContact: new Date(),
        createdAt: new Date(),
      },
      {
        name: "Summit Financial Partners",
        contactName: "Robert Williams",
        contactTitle: "COO",
        email: "robert@summit.example",
        phone: "+1 (555) 567-8901",
        industry: "Finance",
        status: "Discovery",
        websiteUrl: "https://summit.example",
        projectName: "Investment Portal",
        projectDescription: "Client investment portal with secure access",
        projectStatus: "active",
        projectStartDate: new Date("2023-03-15"),
        projectValue: 70000,
        lastContact: new Date(),
        createdAt: new Date(),
      }
    ];
    
    // Insert clients with projects
    const insertedClients = await db.insert(clients).values(sampleClients).returning();
    console.log(`Inserted ${insertedClients.length} clients with projects`);
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seed function if this file is executed directly
// For ESM, we can't use require.main === module, so we'll just export and run
seedDatabase()
  .then(() => {
    console.log('Seed script completed');
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
  });

export { seedDatabase };