import { db } from './db';
import { clients, projects } from '@shared/schema';

async function seedDatabase() {
  console.log('Seeding database...');
  
  try {
    // Check if clients table already has data
    const existingClients = await db.select().from(clients);
    
    if (existingClients.length > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }
    
    // Sample clients data
    const sampleClients = [
      {
        name: "TechVision Inc.",
        contactName: "Jonathan Chen",
        contactTitle: "CEO",
        email: "jonathan@techvision.example",
        phone: "+1 (555) 123-4567",
        industry: "Technology",
        status: "Active",
        logo: "/client-logos/techvision.svg",
        totalValue: 120000,
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
        status: "Pending",
        logo: "/client-logos/greenleaf.svg",
        totalValue: 75000,
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
        status: "Active",
        logo: "/client-logos/horizon.svg",
        totalValue: 95000,
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
        status: "Completed",
        logo: "/client-logos/bluewave.svg",
        totalValue: 65000,
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
        status: "On Hold",
        logo: "/client-logos/summit.svg",
        totalValue: 150000,
        lastContact: new Date(),
        createdAt: new Date(),
      }
    ];
    
    // Insert clients
    const insertedClients = await db.insert(clients).values(sampleClients).returning();
    console.log(`Inserted ${insertedClients.length} clients`);
    
    // Create projects for clients
    const projectsData = [
      // TechVision Projects
      {
        clientId: 1,
        name: "Website Redesign",
        description: "Complete overhaul of corporate website",
        status: "active",
        value: 45000,
        startDate: new Date("2023-02-15"),
      },
      {
        clientId: 1,
        name: "Mobile App Development",
        description: "iOS and Android app for customer portal",
        status: "active",
        value: 60000,
        startDate: new Date("2023-03-01"),
      },
      {
        clientId: 1,
        name: "SEO Optimization",
        description: "Search engine optimization campaign",
        status: "active",
        value: 15000,
        startDate: new Date("2023-04-10"),
      },
      {
        clientId: 1,
        name: "Email Marketing Setup",
        description: "Email marketing campaign setup",
        status: "completed",
        value: 8000,
        startDate: new Date("2023-01-10"),
        endDate: new Date("2023-02-28"),
      },
      {
        clientId: 1,
        name: "Analytics Dashboard",
        description: "Custom analytics dashboard",
        status: "completed",
        value: 12000,
        startDate: new Date("2022-11-01"),
        endDate: new Date("2023-01-15"),
      },
      
      // Greenleaf Projects
      {
        clientId: 2,
        name: "Sustainability Report Website",
        description: "Interactive web presentation of annual sustainability report",
        status: "active",
        value: 30000,
        startDate: new Date("2023-05-01"),
      },
      {
        clientId: 2,
        name: "Brand Identity Refresh",
        description: "Update visual identity to emphasize sustainability",
        status: "completed",
        value: 45000,
        startDate: new Date("2022-12-01"),
        endDate: new Date("2023-03-15"),
      },
      
      // Horizon Media Projects
      {
        clientId: 3,
        name: "Digital Content Platform",
        description: "New content management system for media distribution",
        status: "active",
        value: 55000,
        startDate: new Date("2023-04-01"),
      },
      {
        clientId: 3,
        name: "Video Production Portal",
        description: "Client portal for video production projects",
        status: "active",
        value: 40000,
        startDate: new Date("2023-05-15"),
      },
      {
        clientId: 3,
        name: "Social Media Dashboard",
        description: "Analytics dashboard for social media campaigns",
        status: "completed",
        value: 25000,
        startDate: new Date("2022-10-01"),
        endDate: new Date("2023-01-31"),
      },
      {
        clientId: 3,
        name: "Podcast Network Website",
        description: "Website for podcast network",
        status: "completed",
        value: 35000,
        startDate: new Date("2022-08-15"),
        endDate: new Date("2022-12-20"),
      },
      
      // BlueWave Projects
      {
        clientId: 4,
        name: "Data Visualization Tool",
        description: "Interactive data visualization tool",
        status: "completed",
        value: 40000,
        startDate: new Date("2022-09-01"),
        endDate: new Date("2023-02-28"),
      },
      {
        clientId: 4,
        name: "Business Intelligence Dashboard",
        description: "Executive dashboard for business intelligence",
        status: "completed",
        value: 25000,
        startDate: new Date("2022-07-15"),
        endDate: new Date("2022-12-15"),
      },
      
      // Summit Projects
      {
        clientId: 5,
        name: "Investment Portal",
        description: "Client investment portal with secure access",
        status: "active",
        value: 70000,
        startDate: new Date("2023-03-15"),
      },
      {
        clientId: 5,
        name: "Financial Planning App",
        description: "Mobile app for financial planning",
        status: "on hold",
        value: 55000,
        startDate: new Date("2023-02-01"),
      },
      {
        clientId: 5,
        name: "Advisor Dashboard",
        description: "Dashboard for financial advisors",
        status: "completed",
        value: 25000,
        startDate: new Date("2022-10-15"),
        endDate: new Date("2023-01-31"),
      }
    ];
    
    // Insert projects
    const insertedProjects = await db.insert(projects).values(projectsData).returning();
    console.log(`Inserted ${insertedProjects.length} projects`);
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export { seedDatabase };