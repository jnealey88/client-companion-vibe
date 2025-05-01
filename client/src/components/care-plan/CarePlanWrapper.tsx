import { Client, CompanionTask } from '@shared/schema';
import CarePlanDashboard from './CarePlanDashboard';

interface CarePlanWrapperProps {
  client: Client;
  tasks?: CompanionTask[];
}

export default function CarePlanWrapper({ client, tasks = [] }: CarePlanWrapperProps) {
  // Only show care plan when client is in post launch phase
  const isPostLaunchPhase = client.status === 'Post Launch Management';
  
  if (!isPostLaunchPhase) {
    return null;
  }
  
  return <CarePlanDashboard client={client} tasks={tasks} />;
}
