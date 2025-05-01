import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Client, CompanionTask } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart,
  LineChart,
  Activity,
  Zap,
  Shield,
  Search,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';

interface CarePlanDashboardProps {
  client: Client;
  tasks?: CompanionTask[];
}

type PerformanceData = {
  score: number;
  change: number;
  label: string;
  icon: React.ReactNode;
};

type SecurityItem = {
  status: 'ok' | 'warning' | 'critical';
  label: string;
  lastChecked: string;
};

type MaintenanceTask = {
  id: number;
  name: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
};

export default function CarePlanDashboard({ client, tasks = [] }: CarePlanDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleString());
  
  // Get site analysis data from most recent company_analysis task
  const analysisTask = tasks.find(task => task.type === 'company_analysis' && task.status === 'completed');
  
  // Extract performance metrics from the analysis if available
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([
    {
      score: 78,
      change: 3.2,
      label: 'Performance',
      icon: <Zap className="h-4 w-4 text-purple-500" />
    },
    {
      score: 92,
      change: 0.8,
      label: 'Accessibility',
      icon: <Users className="h-4 w-4 text-blue-500" />
    },
    {
      score: 86,
      change: 4.5,
      label: 'SEO',
      icon: <Search className="h-4 w-4 text-green-500" />
    },
    {
      score: 89,
      change: -1.2,
      label: 'Best Practices',
      icon: <CheckCircle2 className="h-4 w-4 text-orange-500" />
    }
  ]);
  
  const [securityItems, setSecurityItems] = useState<SecurityItem[]>([
    { status: 'ok', label: 'SSL Certificate', lastChecked: '2 days ago' },
    { status: 'ok', label: 'Malware Scan', lastChecked: '1 week ago' },
    { status: 'warning', label: 'WordPress Updates', lastChecked: '2 weeks ago' },
    { status: 'ok', label: 'Plugin Updates', lastChecked: '5 days ago' },
    { status: 'ok', label: 'File Permissions', lastChecked: '1 month ago' }
  ]);
  
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    { 
      id: 1, 
      name: 'Update WordPress core', 
      dueDate: '2023-05-15', 
      status: 'pending', 
      priority: 'high' 
    },
    { 
      id: 2, 
      name: 'Optimize database', 
      dueDate: '2023-05-20', 
      status: 'pending', 
      priority: 'medium' 
    },
    { 
      id: 3, 
      name: 'Review and update content', 
      dueDate: '2023-06-01', 
      status: 'in_progress', 
      priority: 'medium' 
    },
    { 
      id: 4, 
      name: 'Test contact forms', 
      dueDate: '2023-05-10', 
      status: 'completed', 
      priority: 'low' 
    },
  ]);
  
  // Parse real performance data from analysis task if available
  useEffect(() => {
    if (analysisTask?.content) {
      try {
        // For real implementation, extract performance metrics from analysis content
        // This would parse the HTML content or access stored metadata
        // For now using placeholder data
        console.log('Analysis task content available');
      } catch (error) {
        console.error('Error parsing analysis data:', error);
      }
    }
  }, [analysisTask]);
  
  const refreshData = () => {
    // This would trigger a refresh of all data
    setLastUpdated(new Date().toLocaleString());
  };
  
  // Format the priority badge based on priority level
  const getPriorityBadge = (priority: 'low' | 'medium' | 'high') => {
    const classes = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={classes[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };
  
  // Format the status badge for maintenance tasks
  const getStatusBadge = (status: 'pending' | 'in_progress' | 'completed') => {
    const classes = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    
    return (
      <Badge className={classes[status]}>
        {labels[status]}
      </Badge>
    );
  };
  
  const getSecurityIcon = (status: 'ok' | 'warning' | 'critical') => {
    if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Care Plan Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO & Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceData.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {metric.icon}
                      <span className="text-2xl font-bold">{metric.score}</span>
                    </div>
                    <div className={`flex items-center text-sm ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                  <Progress value={metric.score} className="h-2 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>
                  Tasks scheduled for the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceTasks
                    .filter(task => task.status !== 'completed')
                    .slice(0, 3)
                    .map(task => (
                      <div key={task.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{task.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Tasks
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>
                  Current website security overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityItems.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getSecurityIcon(item.status)}
                        <span>{item.label}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        Checked {item.lastChecked}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  View Security Report
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention Needed</AlertTitle>
            <AlertDescription>
              WordPress core update available. Schedule maintenance to keep the site secure.
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        {/* SEO & Performance Tab */}
        <TabsContent value="seo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Core Web Vitals assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Largest Contentful Paint (LCP)</span>
                    <span className="text-green-600 font-medium">2.1s</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>First Input Delay (FID)</span>
                    <span className="text-green-600 font-medium">19ms</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Cumulative Layout Shift (CLS)</span>
                    <span className="text-yellow-600 font-medium">0.14</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart className="h-4 w-4 mr-2" />
                  Run Performance Audit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>SEO Analysis</CardTitle>
                <CardDescription>Top keyword performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">web design services</p>
                      <p className="text-sm text-gray-500">Position: 4</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+2</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">responsive website design</p>
                      <p className="text-sm text-gray-500">Position: 7</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">-1</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">ecommerce store setup</p>
                      <p className="text-sm text-gray-500">Position: 12</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">+5</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  View Full SEO Report
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended Improvements</CardTitle>
              <CardDescription>Based on latest site analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Optimize image sizes</p>
                    <p className="text-sm text-gray-500">Several images on the homepage are not properly sized or compressed.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Fix render-blocking resources</p>
                    <p className="text-sm text-gray-500">CSS and JavaScript files are blocking the rendering of your page.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Improve mobile usability</p>
                    <p className="text-sm text-gray-500">Text elements are too small for mobile devices on product pages.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="default" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Schedule Optimization
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">SSL Certificate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                  <p className="font-bold">Valid & Secure</p>
                  <p className="text-sm text-gray-500">Expires in 89 days</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Malware Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                  <p className="font-bold">Clean</p>
                  <p className="text-sm text-gray-500">Last scan: 7 days ago</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Firewall Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                  <p className="font-bold">Active</p>
                  <p className="text-sm text-gray-500">152 attacks blocked this month</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Checklist</CardTitle>
              <CardDescription>Website security assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getSecurityIcon(item.status)}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-4">Checked {item.lastChecked}</span>
                      <Button variant="outline" size="sm">
                        Check Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Configure Alerts
              </Button>
              <Button variant="default">
                <Shield className="h-4 w-4 mr-2" />
                Run Full Security Audit
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Maintenance Tasks</CardTitle>
                <Button size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule New Task
                </Button>
              </div>
              <CardDescription>Scheduled and recurring maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{task.name}</p>
                        <p className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                      <Button variant="outline" size="sm">
                        {task.status === 'completed' ? 'View Details' : 'Update Status'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Plugin Updates</CardTitle>
                <CardDescription>Current plugin status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Contact Form 7</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Up to date</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">WooCommerce</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Update available</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Yoast SEO</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Update available</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Elementor</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Up to date</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update All Plugins
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Backup History</CardTitle>
                <CardDescription>Recent website backups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="font-medium">Full Site Backup</p>
                      <p className="text-sm text-gray-500">May 1, 2023 - 02:15 AM</p>
                    </div>
                    <Button variant="outline" size="sm">Restore</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="font-medium">Database Backup</p>
                      <p className="text-sm text-gray-500">April 28, 2023 - 01:30 AM</p>
                    </div>
                    <Button variant="outline" size="sm">Restore</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <div>
                      <p className="font-medium">Full Site Backup</p>
                      <p className="text-sm text-gray-500">April 24, 2023 - 02:15 AM</p>
                    </div>
                    <Button variant="outline" size="sm">Restore</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="default" className="w-full">
                  Create Manual Backup
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
