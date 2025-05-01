import React from 'react';
import { Client, CompanionTask } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, ShieldCheck, Activity, Search, Zap, Lock, BarChart2, Award } from 'lucide-react';

interface CarePlanDashboardProps {
  client: Client;
  tasks: CompanionTask[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
}

/**
 * A card component to display a metric with optional trend indicator
 */
function MetricCard({ title, value, description, trend, trendValue, icon }: MetricCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        </div>
        {icon && <div className="text-gray-500">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <div className="text-2xl font-bold">{value}</div>
          {trend && trendValue && (
            <div className={`ml-2 text-sm flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
              {trend === 'up' ? <ArrowUpCircle className="h-4 w-4 mr-1" /> : trend === 'down' ? <ArrowDownCircle className="h-4 w-4 mr-1" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function CarePlanDashboard({ client, tasks }: CarePlanDashboardProps) {
  // Get the last 6 months of performance data using OpenAI-generated website performance data
  const { data: performanceData } = useQuery({
    queryKey: [`/api/clients/${client.id}/website-performance`],
    enabled: !!client.websiteUrl,
    // If API endpoint is not available, we'll just use the client's current data
    placeholderData: []
  });
  
  // Sample data structures - in production, this would come from real API calls
  const sampleSeoData = [
    { month: 'Jan', visits: 1500, ranking: 35 },
    { month: 'Feb', visits: 1820, ranking: 28 },
    { month: 'Mar', visits: 2100, ranking: 22 },
    { month: 'Apr', visits: 2400, ranking: 18 },
    { month: 'May', visits: 2700, ranking: 15 },
    { month: 'Jun', visits: 3200, ranking: 12 },
  ];

  const samplePerformanceScore = 86;
  const sampleAccessibilityScore = 92;
  const sampleSeoScore = 88;
  const sampleBestPracticesScore = 78;
  
  const maintenanceStatus = {
    lastBackupDate: '2025-04-22',
    pluginsToUpdate: 2,
    securityIssues: 0,
    uptime: '99.8%'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="h-5 w-5 text-green-600" />
        <h2 className="text-xl font-bold">Care Plan Dashboard</h2>
        <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
          Post Launch Management
        </Badge>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="SEO Ranking" 
          value={`${sampleSeoData[sampleSeoData.length - 1].ranking}`} 
          description="Average position for top keywords" 
          trend="up"
          trendValue="+3 positions"
          icon={<Search className="h-5 w-5" />}
        />
        
        <MetricCard 
          title="Website Performance" 
          value={`${samplePerformanceScore}/100`} 
          description="Google PageSpeed score" 
          trend={samplePerformanceScore > 80 ? 'up' : 'down'}
          trendValue={samplePerformanceScore > 80 ? 'Good' : 'Needs improvement'}
          icon={<Zap className="h-5 w-5" />}
        />
        
        <MetricCard 
          title="Security Status" 
          value="Secure" 
          description={`Last scan: ${maintenanceStatus.lastBackupDate}`} 
          trend={maintenanceStatus.securityIssues === 0 ? 'up' : 'down'}
          trendValue={maintenanceStatus.securityIssues === 0 ? 'No issues' : `${maintenanceStatus.securityIssues} issues`}
          icon={<Lock className="h-5 w-5" />}
        />
        
        <MetricCard 
          title="Monthly Traffic" 
          value={sampleSeoData[sampleSeoData.length - 1].visits.toLocaleString()} 
          description="Visitors last month" 
          trend="up"
          trendValue="+18.5%"
          icon={<BarChart2 className="h-5 w-5" />}
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Performance Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" /> 
              <span>Search Engine Ranking</span>
            </CardTitle>
            <CardDescription>Average position for top keywords over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sampleSeoData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[40, 0]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ranking" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-xs text-center text-gray-500 mt-2">Lower rank number is better</div>
            </div>
          </CardContent>
        </Card>
        
        {/* Traffic Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-green-500" />
              <span>Website Traffic</span>
            </CardTitle>
            <CardDescription>Monthly visitors to your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sampleSeoData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="visits" fill="#22c55e" stroke="#16a34a" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Metrics Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            <span>Performance Metrics</span>
          </CardTitle>
          <CardDescription>Core Web Vitals and technical performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Performance</span>
                <span className="font-medium">{samplePerformanceScore}/100</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${samplePerformanceScore >= 90 ? 'bg-green-500' : samplePerformanceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${samplePerformanceScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">Loading speed and interactivity</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Accessibility</span>
                <span className="font-medium">{sampleAccessibilityScore}/100</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${sampleAccessibilityScore >= 90 ? 'bg-green-500' : sampleAccessibilityScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${sampleAccessibilityScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">How accessible your site is to all users</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">SEO</span>
                <span className="font-medium">{sampleSeoScore}/100</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${sampleSeoScore >= 90 ? 'bg-green-500' : sampleSeoScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${sampleSeoScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">Search engine optimization score</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Best Practices</span>
                <span className="font-medium">{sampleBestPracticesScore}/100</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${sampleBestPracticesScore >= 90 ? 'bg-green-500' : sampleBestPracticesScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${sampleBestPracticesScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">Modern web development standards</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Maintenance Details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <span>Maintenance Details</span>
          </CardTitle>
          <CardDescription>Current status of your website care plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-gray-700 font-medium">Backups</span>
              </div>
              <p className="text-sm text-gray-600">Last backup: {maintenanceStatus.lastBackupDate}</p>
              <p className="text-xs text-gray-500">Daily backups active</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${maintenanceStatus.pluginsToUpdate > 0 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                <span className="text-gray-700 font-medium">Updates</span>
              </div>
              <p className="text-sm text-gray-600">{maintenanceStatus.pluginsToUpdate} plugins need updating</p>
              <p className="text-xs text-gray-500">Updates scheduled weekly</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${maintenanceStatus.securityIssues > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="text-gray-700 font-medium">Security</span>
              </div>
              <p className="text-sm text-gray-600">{maintenanceStatus.securityIssues} security issues detected</p>
              <p className="text-xs text-gray-500">Firewall active and monitoring</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${parseFloat(maintenanceStatus.uptime) > 99.5 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className="text-gray-700 font-medium">Uptime</span>
              </div>
              <p className="text-sm text-gray-600">{maintenanceStatus.uptime} uptime last 30 days</p>
              <p className="text-xs text-gray-500">24/7 monitoring active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
