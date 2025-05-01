import React from 'react';
import { Client, CompanionTask } from '@shared/schema';
import CarePlanDashboard from './CarePlanDashboard';

interface CarePlanWrapperProps {
  client: Client;
  tasks: CompanionTask[];
}

/**
 * Wrapper component that conditionally renders the Care Plan Dashboard
 * only when the client is in the Post Launch Management phase
 */
export default function CarePlanWrapper({ client, tasks }: CarePlanWrapperProps) {
  // Only show the care plan dashboard if the client is in Post Launch Management phase
  if (client.status !== 'Post Launch Management') {
    return null;
  }
  
  return <CarePlanDashboard client={client} tasks={tasks} />;
}
