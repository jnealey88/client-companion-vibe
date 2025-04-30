import { useState } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Client } from "@shared/schema";
import { ArrowUp, ArrowDown, Zap, Lock, Clock, Globe, Search, PieChart, AlertTriangle } from "lucide-react";

interface ClientPerformanceDashboardProps {
  client: Client;
}

// Dummy data for the dashboard
const getDummyPerformanceData = (clientId: number) => {
  // Generate consistent data based on client ID for demo purposes
  const seed = clientId * 7;
  
  // Last 6 months of data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // SEO performance data
  const seoData = months.map((month, index) => {
    const baseValue = 50 + (seed % 20) + (index * 3);
    const organicTraffic = Math.floor(baseValue * (1 + (index * 0.1)));
    const keywordRankings = Math.floor(10 + (seed % 5) + (index * 0.5));
    return {
      month,
      organicTraffic,
      keywordRankings
    };
  });

  // Site performance data
  const sitePerformanceData = {
    score: 78 + (seed % 15),
    speedIndex: 2.8 + ((seed % 10) / 10),
    firstContentfulPaint: 1.2 + ((seed % 8) / 10),
    timeToInteractive: 3.5 + ((seed % 15) / 10),
    largestContentfulPaint: 2.9 + ((seed % 12) / 10),
  };

  // Uptime data
  const uptimeData = {
    uptime: 99.7 + ((seed % 5) / 10),
    responseTime: 187 + (seed % 100),
    incidents: (seed % 3),
    lastIncident: incidents[seed % incidents.length],
  };

  // Security score
  const securityData = {
    score: 85 + (seed % 12),
    sslValid: true,
    malwareDetected: false,
    vulnerabilities: (seed % 3),
    lastScan: `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`
  };

  // Traffic sources
  const trafficSourcesData = [
    { name: 'Organic', value: 35 + (seed % 20) },
    { name: 'Direct', value: 30 + (seed % 15) },
    { name: 'Social', value: 20 + (seed % 10) },
    { name: 'Referral', value: 15 + (seed % 10) },
  ];

  // Top keywords
  const topKeywords = [
    {
      keyword: keywords[seed % keywords.length],
      position: 1 + (seed % 10),
      trend: (seed % 2 === 0) ? 'up' : 'down',
      change: 1 + (seed % 3)
    },
    {
      keyword: keywords[(seed + 1) % keywords.length],
      position: 2 + (seed % 15),
      trend: (seed % 2 === 0) ? 'up' : 'down',
      change: 1 + (seed % 4)
    },
    {
      keyword: keywords[(seed + 2) % keywords.length],
      position: 3 + (seed % 20),
      trend: ((seed + 1) % 2 === 0) ? 'up' : 'down',
      change: 1 + (seed % 3)
    },
    {
      keyword: keywords[(seed + 3) % keywords.length],
      position: 5 + (seed % 25),
      trend: ((seed + 2) % 2 === 0) ? 'up' : 'down',
      change: 1 + (seed % 5)
    },
    {
      keyword: keywords[(seed + 4) % keywords.length],
      position: 8 + (seed % 30),
      trend: ((seed + 3) % 2 === 0) ? 'up' : 'down',
      change: 1 + (seed % 2)
    },
  ];

  return {
    seoData,
    sitePerformanceData,
    uptimeData,
    securityData,
    trafficSourcesData,
    topKeywords
  };
};

// Sample keywords and incidents for dummy data
const keywords = [
  'web design services',
  'website development company',
  'responsive web design',
  'affordable website design',
  'professional web developer',
  'ecommerce website development',
  'custom website design',
  'web design agency',
  'website redesign services',
  'mobile friendly website design',
  'business website development',
  'wordpress website design',
  'local web designer',
  'web design portfolio',
  'web design pricing'
];

const incidents = [
  'Server timeout',
  'Database connection error',
  'High CPU usage',
  'Memory leak',
  'Slow response time',
  'SSL certificate error',
  'DNS resolution failure'
];

export default function ClientPerformanceDashboard({ client }: ClientPerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState('seo');
  
  // Get dummy data based on client ID
  const {
    seoData,
    sitePerformanceData,
    uptimeData,
    securityData,
    trafficSourcesData,
    topKeywords
  } = getDummyPerformanceData(client.id);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="bg-black text-white pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Website Performance Dashboard</CardTitle>
            <CardDescription className="text-gray-300 mt-1">
              Monitor and optimize {client.name}'s website performance
            </CardDescription>
          </div>
          <Badge className="bg-green-500 hover:bg-green-600">
            Site Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full grid grid-cols-4 rounded-lg bg-gray-100">
            <TabsTrigger value="seo" className="rounded-md">
              <Search className="h-4 w-4 mr-2" />
              SEO & Keywords
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-md">
              <Zap className="h-4 w-4 mr-2" />
              Site Speed
            </TabsTrigger>
            <TabsTrigger value="uptime" className="rounded-md">
              <Clock className="h-4 w-4 mr-2" />
              Uptime
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-md">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* SEO & Keywords Tab */}
          <TabsContent value="seo" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Organic Traffic</CardTitle>
                  <CardDescription>
                    Monthly visitors from search engines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {seoData[seoData.length - 1].organicTraffic}
                    <span className="text-sm text-green-600 ml-2">
                      <ArrowUp className="h-4 w-4 inline" />
                      {Math.floor((seoData[seoData.length - 1].organicTraffic - seoData[seoData.length - 2].organicTraffic) / seoData[seoData.length - 2].organicTraffic * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Keyword Rankings</CardTitle>
                  <CardDescription>
                    Average position in search results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {seoData[seoData.length - 1].keywordRankings}
                    <span className="text-sm text-green-600 ml-2">
                      <ArrowUp className="h-4 w-4 inline" />
                      {Math.floor((seoData[seoData.length - 1].keywordRankings - seoData[seoData.length - 2].keywordRankings) / seoData[seoData.length - 2].keywordRankings * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Visibility Score</CardTitle>
                  <CardDescription>
                    Overall search visibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {65 + (client.id % 20)}%
                    <span className="text-sm text-green-600 ml-2">
                      <ArrowUp className="h-4 w-4 inline" />
                      {5 + (client.id % 8)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Organic Traffic Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={seoData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="organicTraffic" stroke="#3b82f6" name="Organic Traffic" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Ranking Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-left">
                          <th className="pb-2">Keyword</th>
                          <th className="pb-2">Position</th>
                          <th className="pb-2">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topKeywords.map((keyword, index) => (
                          <tr key={index} className="border-t">
                            <td className="py-2 text-sm">{keyword.keyword}</td>
                            <td className="py-2 text-sm">{keyword.position}</td>
                            <td className="py-2">
                              {keyword.trend === 'up' ? (
                                <span className="text-xs text-green-600 flex items-center">
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                  {keyword.change}
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 flex items-center">
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                  {keyword.change}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 py-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View All Keywords
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Site Performance Tab */}
          <TabsContent value="performance" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Performance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{sitePerformanceData.score}/100</div>
                    <Progress value={sitePerformanceData.score} className="h-2" />
                    <div className="mt-2 text-sm text-gray-500">
                      {sitePerformanceData.score >= 90 ? 'Excellent' : 
                       sitePerformanceData.score >= 70 ? 'Good' : 
                       sitePerformanceData.score >= 50 ? 'Needs Improvement' : 'Poor'}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{sitePerformanceData.largestContentfulPaint}s</div>
                      <div className="text-xs text-gray-500">Largest Contentful Paint</div>
                      <Badge className={sitePerformanceData.largestContentfulPaint < 2.5 ? "bg-green-500 mt-1" : "bg-yellow-500 mt-1"}>
                        {sitePerformanceData.largestContentfulPaint < 2.5 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{sitePerformanceData.firstContentfulPaint}s</div>
                      <div className="text-xs text-gray-500">First Contentful Paint</div>
                      <Badge className={sitePerformanceData.firstContentfulPaint < 2 ? "bg-green-500 mt-1" : "bg-yellow-500 mt-1"}>
                        {sitePerformanceData.firstContentfulPaint < 2 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{sitePerformanceData.timeToInteractive}s</div>
                      <div className="text-xs text-gray-500">Time to Interactive</div>
                      <Badge className={sitePerformanceData.timeToInteractive < 3.8 ? "bg-green-500 mt-1" : "bg-yellow-500 mt-1"}>
                        {sitePerformanceData.timeToInteractive < 3.8 ? "Good" : "Needs Improvement"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Optimization Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Optimize Images</p>
                        <p className="text-xs text-gray-500">Properly size images could save 340 KB</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Reduce JavaScript</p>
                        <p className="text-xs text-gray-500">Consider reducing JS bundle size by 220 KB</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Enable Text Compression</p>
                        <p className="text-xs text-gray-500">Compressing text could save 150 KB</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 py-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View All Opportunities
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { month: 'Jan', score: sitePerformanceData.score - 12 },
                        { month: 'Feb', score: sitePerformanceData.score - 8 },
                        { month: 'Mar', score: sitePerformanceData.score - 5 },
                        { month: 'Apr', score: sitePerformanceData.score - 3 },
                        { month: 'May', score: sitePerformanceData.score - 1 },
                        { month: 'Jun', score: sitePerformanceData.score },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="score" stroke="#16a34a" name="Performance Score" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Uptime Tab */}
          <TabsContent value="uptime" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{uptimeData.uptime}%</div>
                    <Progress value={uptimeData.uptime} className="h-2" />
                    <div className="mt-2 text-sm text-gray-500">
                      Last 30 days
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{uptimeData.responseTime}ms</div>
                    <Progress value={100 - (uptimeData.responseTime / 10)} className="h-2" />
                    <div className="mt-2 text-sm text-gray-500">
                      Average response time
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{uptimeData.incidents}</div>
                    <div className="mt-2 text-sm text-gray-500">
                      {uptimeData.incidents === 0 ? "No incidents in the last 30 days" : 
                       `Last incident: ${uptimeData.lastIncident}`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Uptime History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { day: '25', uptime: 100, responseTime: uptimeData.responseTime + 15 },
                      { day: '26', uptime: 100, responseTime: uptimeData.responseTime + 8 },
                      { day: '27', uptime: uptimeData.incidents > 0 ? 99.2 : 100, responseTime: uptimeData.responseTime + 30 },
                      { day: '28', uptime: 100, responseTime: uptimeData.responseTime + 5 },
                      { day: '29', uptime: 100, responseTime: uptimeData.responseTime - 10 },
                      { day: '30', uptime: 100, responseTime: uptimeData.responseTime },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis yAxisId="left" orientation="left" domain={[98, 100]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#3b82f6" name="Uptime %" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="responseTime" stroke="#16a34a" name="Response Time (ms)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Security Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{securityData.score}/100</div>
                    <Progress value={securityData.score} className="h-2" />
                    <div className="mt-2 text-sm text-gray-500">
                      {securityData.score >= 90 ? 'Excellent' : 
                       securityData.score >= 70 ? 'Good' : 
                       securityData.score >= 50 ? 'Needs Improvement' : 'Poor'}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">SSL Certificate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="mb-2">
                      {securityData.sslValid ? 
                        <Lock className="h-12 w-12 mx-auto text-green-500" /> :
                        <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
                      }
                    </div>
                    <div className="font-medium">{securityData.sslValid ? "Valid" : "Invalid"}</div>
                    <div className="mt-2 text-sm text-gray-500">
                      Expires in 8 months
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Security Scan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="font-medium">
                      {securityData.vulnerabilities === 0 ? 
                        <span className="text-green-500">No vulnerabilities</span> : 
                        <span className="text-yellow-500">{securityData.vulnerabilities} vulnerabilities found</span>
                      }
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Last scan: {securityData.lastScan}
                    </div>
                    <Button variant="outline" size="sm" className="mt-4 text-xs">
                      Run New Scan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Security Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {securityData.vulnerabilities > 0 && (
                      <li className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Update WordPress Core</p>
                          <p className="text-xs text-gray-500">Current version has known vulnerabilities</p>
                        </div>
                      </li>
                    )}
                    <li className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Enable Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500">Add an extra layer of security to admin access</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Update Plugins</p>
                        <p className="text-xs text-gray-500">2 plugins need updates to patch security issues</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 py-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View All Recommendations
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex">
                      <div className="min-w-[100px] text-gray-500">Today</div>
                      <div>Security scan completed</div>
                    </div>
                    <div className="flex">
                      <div className="min-w-[100px] text-gray-500">Yesterday</div>
                      <div>SSL certificate verified</div>
                    </div>
                    <div className="flex">
                      <div className="min-w-[100px] text-gray-500">3 days ago</div>
                      <div>Malware scan completed - No threats found</div>
                    </div>
                    <div className="flex">
                      <div className="min-w-[100px] text-gray-500">1 week ago</div>
                      <div>Security headers updated</div>
                    </div>
                    <div className="flex">
                      <div className="min-w-[100px] text-gray-500">2 weeks ago</div>
                      <div>Firewall rules updated</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 py-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Full Activity Log
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t py-3 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Data last updated: Today at {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}
        </div>
        <Button variant="default" size="sm">
          <Zap className="h-4 w-4 mr-2" />
          Generate Performance Report
        </Button>
      </CardFooter>
    </Card>
  );
}