import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Client, CompanionTask } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Zap, Lock, Clock, BarChart, RefreshCw, PieChart, CheckCircle } from "lucide-react";

interface ClientPerformanceDashboardProps {
  client: Client;
}

interface PerformanceData {
  seo: {
    overall: number;
    topKeywords: { keyword: string; position: number; volume: string; change: number }[];
    visibility: number;
    visibilityChange: number;
  };
  speed: {
    overall: number;
    mobile: number;
    desktop: number;
    coreWebVitals: { name: string; value: number; target: number }[];
  };
  security: {
    overall: number;
    vulnerabilities: { severity: string; count: number; description: string }[];
    lastScan: string;
  };
  uptime: {
    overall: number;
    last30Days: number;
    incidents: { date: string; duration: number; reason: string }[];
    averageResponseTime: number;
  };
}

// Mock data to be replaced with real data fetching
const getDemoData = (client: Client): PerformanceData => {
  return {
    seo: {
      overall: 78,
      topKeywords: [
        { keyword: "web design agency", position: 12, volume: "5.2K", change: 3 },
        { keyword: client.industry.toLowerCase(), position: 8, volume: "4.8K", change: -2 },
        { keyword: "professional website design", position: 15, volume: "3.6K", change: 5 },
        { keyword: `${client.industry.toLowerCase()} websites`, position: 9, volume: "2.9K", change: 0 },
        { keyword: "responsive web design", position: 22, volume: "8.4K", change: -4 }
      ],
      visibility: 42,
      visibilityChange: 8
    },
    speed: {
      overall: 83,
      mobile: 76,
      desktop: 91,
      coreWebVitals: [
        { name: "LCP", value: 2.4, target: 2.5 },
        { name: "FID", value: 18, target: 100 },
        { name: "CLS", value: 0.05, target: 0.1 }
      ]
    },
    security: {
      overall: 92,
      vulnerabilities: [
        { severity: "High", count: 0, description: "No critical vulnerabilities detected" },
        { severity: "Medium", count: 2, description: "SSL certificate warning, outdated plugin version" },
        { severity: "Low", count: 5, description: "Minor information disclosure issues" }
      ],
      lastScan: new Date(Date.now() - 86400000 * 3).toLocaleDateString() // 3 days ago
    },
    uptime: {
      overall: 99.97,
      last30Days: 99.99,
      incidents: [
        { date: new Date(Date.now() - 86400000 * 12).toLocaleDateString(), duration: 22, reason: "Server maintenance" },
        { date: new Date(Date.now() - 86400000 * 24).toLocaleDateString(), duration: 5, reason: "Network outage" }
      ],
      averageResponseTime: 0.38
    }
  };
};

export default function ClientPerformanceDashboard({ client }: ClientPerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const { toast } = useToast();
  
  // Fetch companion tasks for the client
  const { data: tasks, isLoading } = useQuery<CompanionTask[]>({
    queryKey: [`/api/clients/${client.id}/companion-tasks`],
    enabled: !!client.id
  });
  
  // Initialize data
  useEffect(() => {
    const data = getDemoData(client);
    setPerformanceData(data);
  }, [client]);
  
  // Handle manual refresh of metrics
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      const data = getDemoData(client);
      setPerformanceData(data);
      setRefreshing(false);
      
      toast({
        title: "Metrics refreshed",
        description: "Latest performance data has been loaded.",
      });
    }, 1500);
  };
  
  if (isLoading || !performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Fetching performance metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              <span>Website Performance Dashboard</span>
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">Post-Launch Care</Badge>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Track and optimize your website's performance, security, and search visibility
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="seo">SEO & Keywords</TabsTrigger>
            <TabsTrigger value="performance">Speed & Performance</TabsTrigger>
            <TabsTrigger value="security">Security & Uptime</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Shows summary metrics for all categories */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard 
                title="SEO Score" 
                value={performanceData.seo.overall} 
                icon={<Search className="h-5 w-5" />}
                trend={performanceData.seo.visibilityChange} 
                color="blue"
              />
              <MetricCard 
                title="Site Speed" 
                value={performanceData.speed.overall} 
                icon={<Zap className="h-5 w-5" />}
                color="green"
              />
              <MetricCard 
                title="Security" 
                value={performanceData.security.overall} 
                icon={<Lock className="h-5 w-5" />}
                color="red"
              />
              <MetricCard 
                title="Uptime" 
                value={performanceData.uptime.overall} 
                icon={<Clock className="h-5 w-5" />} 
                suffix="%"
                color="purple"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recent Activity</h3>
              <div className="space-y-2">
                <ActivityItem 
                  icon={<Search className="h-4 w-4" />} 
                  title="SEO visibility increased by 8%"
                  date="Today"
                  description="Your website's search visibility has improved significantly"
                  color="blue"
                />
                <ActivityItem 
                  icon={<Clock className="h-4 w-4" />} 
                  title="100% uptime this week"
                  date="This week"
                  description="Your website has been fully operational with no downtime"
                  color="green"
                />
                <ActivityItem 
                  icon={<Lock className="h-4 w-4" />} 
                  title="Security scan completed"
                  date={performanceData.security.lastScan}
                  description={`${performanceData.security.vulnerabilities.reduce((sum, v) => sum + v.count, 0)} potential issues identified`}
                  color="amber"
                />
              </div>
            </div>
          </TabsContent>

          {/* SEO Tab - Shows detailed keyword and visibility metrics */}
          <TabsContent value="seo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <MetricCard 
                title="Overall SEO Score" 
                value={performanceData.seo.overall} 
                icon={<Search className="h-5 w-5" />}
                color="blue"
                size="lg"
              />
              <MetricCard 
                title="Search Visibility" 
                value={performanceData.seo.visibility} 
                icon={<PieChart className="h-5 w-5" />}
                trend={performanceData.seo.visibilityChange} 
                color="indigo"
                size="lg"
              />
              <div className="bg-blue-50 rounded-lg p-4 flex flex-col justify-center">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Search Visibility Trend</h3>
                <div className="h-8 bg-blue-100 rounded-md relative overflow-hidden mt-2">
                  <div className="absolute inset-0 flex items-center">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="h-full w-full" 
                        style={{ 
                          height: `${30 + Math.random() * 70}%`, 
                          backgroundColor: i % 2 === 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)'
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">Last 30 days trending upward (+{performanceData.seo.visibilityChange}%)</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Top Keywords</h3>
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Keyword</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Position</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Monthly Volume</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.seo.topKeywords.map((keyword, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="px-4 py-3 text-sm">{keyword.keyword}</td>
                        <td className="px-4 py-3 text-sm">{keyword.position}</td>
                        <td className="px-4 py-3 text-sm">{keyword.volume}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`flex items-center ${keyword.change > 0 ? 'text-green-600' : keyword.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {keyword.change > 0 ? '↑' : keyword.change < 0 ? '↓' : '−'}
                            {Math.abs(keyword.change)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">View Full SEO Report</Button>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab - Shows speed metrics and Core Web Vitals */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <MetricCard 
                title="Overall Speed Score" 
                value={performanceData.speed.overall} 
                icon={<Zap className="h-5 w-5" />}
                color="green"
                size="lg"
              />
              <MetricCard 
                title="Mobile Speed" 
                value={performanceData.speed.mobile} 
                icon={<BarChart className="h-5 w-5" />}
                color="orange"
                size="lg"
              />
              <MetricCard 
                title="Desktop Speed" 
                value={performanceData.speed.desktop} 
                icon={<BarChart className="h-5 w-5" />}
                color="blue"
                size="lg"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Core Web Vitals</h3>
              <div className="space-y-4">
                {performanceData.speed.coreWebVitals.map((metric, index) => (
                  <div key={index} className="bg-white rounded-lg border p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{metric.name}</h4>
                        <p className="text-sm text-gray-500">
                          {metric.name === 'LCP' ? 'Largest Contentful Paint' :
                           metric.name === 'FID' ? 'First Input Delay' :
                           'Cumulative Layout Shift'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-semibold ${metric.value <= metric.target ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.value}{metric.name === 'LCP' ? 's' : metric.name === 'FID' ? 'ms' : ''}
                        </span>
                        <p className="text-xs text-gray-500">Target: {metric.target}{metric.name === 'LCP' ? 's' : metric.name === 'FID' ? 'ms' : ''}</p>
                      </div>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${metric.value <= metric.target ? 'bg-green-100' : 'bg-red-100'}`}>
                      <div 
                        className={`h-full rounded-full ${metric.value <= metric.target ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${(metric.value / metric.target) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">Generate Performance Report</Button>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab - Shows security vulnerabilities and uptime */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <MetricCard 
                title="Security Score" 
                value={performanceData.security.overall} 
                icon={<Lock className="h-5 w-5" />}
                color="red"
                size="lg"
              />
              <MetricCard 
                title="30-Day Uptime" 
                value={performanceData.uptime.last30Days} 
                icon={<Clock className="h-5 w-5" />}
                suffix="%"
                color="green"
                size="lg"
              />
              <MetricCard 
                title="Response Time" 
                value={performanceData.uptime.averageResponseTime} 
                icon={<Zap className="h-5 w-5" />}
                suffix="s"
                color="blue"
                size="lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Vulnerabilities</h3>
                <div className="space-y-3">
                  {performanceData.security.vulnerabilities.map((vuln, index) => (
                    <div key={index} className="bg-white rounded-lg border p-4">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 ${vuln.severity === 'High' ? 'bg-red-100 text-red-700' : 
                                                                  vuln.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                                                                  'bg-blue-100 text-blue-700'}`}>
                          <Lock className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {vuln.severity} severity
                            <Badge variant="outline" className="text-xs">{vuln.count}</Badge>
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{vuln.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Uptime Incidents</h3>
                {performanceData.uptime.incidents.length === 0 ? (
                  <div className="bg-green-50 text-green-700 rounded-lg border border-green-200 p-4 flex items-center justify-center h-[150px]">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">No downtime incidents</p>
                      <p className="text-sm text-green-600 mt-1">Your website has been 100% available</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {performanceData.uptime.incidents.map((incident, index) => (
                      <div key={index} className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-medium">{incident.reason}</h4>
                          <span className="text-sm text-gray-500">{incident.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Duration: <span className="font-medium">{incident.duration} minutes</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full">Run Security Scan</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  suffix?: string;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "indigo" | "orange";
  size?: "default" | "lg";
}

function MetricCard({ title, value, icon, trend, suffix = "", color = "blue", size = "default" }: MetricCardProps) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200"
  };
  
  const progressColor = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    amber: "bg-amber-600",
    purple: "bg-purple-600",
    indigo: "bg-indigo-600",
    orange: "bg-orange-600"
  };
  
  const bgColor = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    red: "bg-red-100",
    amber: "bg-amber-100",
    purple: "bg-purple-100",
    indigo: "bg-indigo-100",
    orange: "bg-orange-100"
  };
  
  return (
    <div className={`rounded-lg border px-4 py-3 ${size === 'lg' ? 'py-5' : ''} ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="p-1.5 rounded-full">
          {icon}
        </div>
      </div>
      <div className={`flex items-end gap-2 ${size === 'lg' ? 'mt-4' : 'mt-2'}`}>
        <div className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>
          {value}{suffix}
        </div>
        {trend !== undefined && (
          <div className={`text-xs mb-1 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {trend > 0 ? `↑ ${trend}%` : trend < 0 ? `↓ ${Math.abs(trend)}%` : `${trend}%`}
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="h-2 w-full rounded-full overflow-hidden bg-white">
          <div 
            className={`h-full rounded-full ${progressColor[color]}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  date: string;
  description: string;
  color: "blue" | "green" | "red" | "amber" | "purple" | "indigo" | "orange";
}

function ActivityItem({ icon, title, date, description, color }: ActivityItemProps) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-purple-100 text-purple-700",
    indigo: "bg-indigo-100 text-indigo-700",
    orange: "bg-orange-100 text-orange-700"
  };
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start">
        <div className={`p-2 rounded-full mr-3 ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{title}</h4>
            <span className="text-xs text-gray-500 ml-auto">{date}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
