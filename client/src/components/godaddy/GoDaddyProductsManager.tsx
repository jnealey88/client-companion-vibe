import { useState, useEffect } from "react";
import { 
  User, 
  Globe, 
  Lock, 
  Code, 
  Check, 
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  Gauge,
  Mail,
  Settings,
  Archive,
  Clock,
  Tag,
  HelpCircle,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Client } from "@shared/schema";

type ProductStatus = "active" | "expiring" | "inactive" | "suspended";

interface Product {
  id: string;
  name: string;
  type: "domain" | "hosting" | "email" | "security" | "marketing";
  status: ProductStatus;
  expiryDate: Date | null;
  details: string;
  renewalPrice?: number;
  autoRenew: boolean;
}

interface GoDaddyProductsManagerProps {
  client: Client;
}

// Mock data for now - this would connect to GoDaddy API in production
const mockProducts: Product[] = [
  {
    id: "1",
    name: "fracturedchoices.com",
    type: "domain",
    status: "active",
    expiryDate: new Date(2025, 11, 31),
    details: "Primary domain registered through GoDaddy",
    renewalPrice: 15.99,
    autoRenew: true
  },
  {
    id: "2",
    name: "Economy Linux Hosting with cPanel",
    type: "hosting",
    status: "active",
    expiryDate: new Date(2025, 5, 15),
    details: "10GB storage, Unlimited bandwidth",
    renewalPrice: 8.99,
    autoRenew: true
  },
  {
    id: "3",
    name: "Email Essentials",
    type: "email",
    status: "expiring",
    expiryDate: new Date(2025, 2, 10),
    details: "5 mailboxes with 10GB storage each",
    renewalPrice: 5.99,
    autoRenew: false
  },
  {
    id: "4",
    name: "SSL Certificate (Standard)",
    type: "security",
    status: "active",
    expiryDate: new Date(2025, 6, 22),
    details: "Basic encryption and validation",
    renewalPrice: 7.99,
    autoRenew: true
  },
  {
    id: "5",
    name: "Website Builder",
    type: "hosting",
    status: "inactive",
    expiryDate: null,
    details: "GoDaddy Website Builder - unused",
    renewalPrice: 9.99,
    autoRenew: false
  }
];

const productIcons = {
  domain: <Globe className="h-4 w-4" />,
  hosting: <Code className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  security: <Lock className="h-4 w-4" />,
  marketing: <Gauge className="h-4 w-4" />
};

const getStatusBadge = (status: ProductStatus) => {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
    case "expiring":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expiring Soon</Badge>;
    case "inactive":
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
    case "suspended":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Suspended</Badge>;
  }
};

export default function GoDaddyProductsManager({ client }: GoDaddyProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const filteredProducts = activeTab === "all" 
    ? products 
    : products.filter(product => product.type === activeTab);
  
  // Group products by type for the accordion view
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
  
  const productTypeCounts = {
    all: products.length,
    domain: products.filter(p => p.type === "domain").length,
    hosting: products.filter(p => p.type === "hosting").length,
    email: products.filter(p => p.type === "email").length,
    security: products.filter(p => p.type === "security").length,
    marketing: products.filter(p => p.type === "marketing").length,
  };
  
  const productTypeLabels = {
    domain: "Domains",
    hosting: "Hosting",
    email: "Email",
    security: "Security",
    marketing: "Marketing"
  };
  
  // Calculate if any products are expiring soon (within 30 days)
  const hasExpiringSoon = products.some(product => {
    if (!product.expiryDate) return false;
    const daysUntilExpiry = Math.ceil((product.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  });
  
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-white p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">GoDaddy Products & Services</CardTitle>
              <CardDescription className="text-xs">
                Manage client's GoDaddy products and services
              </CardDescription>
            </div>
          </div>
          {hasExpiringSoon && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Items expiring soon
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Some products are expiring within 30 days</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b bg-white">
            <TabsList className="w-full justify-start px-2 h-auto flex-wrap overflow-x-auto">
              <TabsTrigger 
                value="all" 
                className="py-2 px-3 text-xs rounded-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                All ({productTypeCounts.all})
              </TabsTrigger>
              <TabsTrigger 
                value="domain" 
                className="py-2 px-3 text-xs rounded-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Globe className="h-3 w-3 mr-1" />
                Domains ({productTypeCounts.domain})
              </TabsTrigger>
              <TabsTrigger 
                value="hosting" 
                className="py-2 px-3 text-xs rounded-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Code className="h-3 w-3 mr-1" />
                Hosting ({productTypeCounts.hosting})
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="py-2 px-3 text-xs rounded-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email ({productTypeCounts.email})
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="py-2 px-3 text-xs rounded-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Lock className="h-3 w-3 mr-1" />
                Security ({productTypeCounts.security})
              </TabsTrigger>
              <TabsTrigger 
                value="marketing" 
                className="py-2 px-3 text-xs rounded-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Gauge className="h-3 w-3 mr-1" />
                Marketing ({productTypeCounts.marketing})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={activeTab} className="pt-2">
            {activeTab === "all" ? (
              <div className="divide-y">
                <Accordion type="multiple" defaultValue={[]} className="w-full">
                  {Object.entries(groupedProducts).map(([type, items]) => (
                    <AccordionItem value={type} key={type} className="border-b border-gray-200 last:border-0 px-4">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          {productIcons[type as keyof typeof productIcons]}
                          {productTypeLabels[type as keyof typeof productTypeLabels]} ({items.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pb-2">
                          {items.map(product => (
                            <div key={product.id} className="border rounded-md p-3 bg-white shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-md bg-gray-50">
                                    {productIcons[product.type]}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">{product.name}</h4>
                                    <p className="text-xs text-gray-500">{product.details}</p>
                                  </div>
                                </div>
                                {getStatusBadge(product.status)}
                              </div>
                              
                              <div className="flex justify-between items-center text-xs text-gray-600 mt-3">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {product.expiryDate ? (
                                    `Expires: ${product.expiryDate.toLocaleDateString()}`
                                  ) : (
                                    "No expiration date"
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  {product.autoRenew ? (
                                    <Badge variant="outline" className="px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                      <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                                      Auto-renew
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="px-1.5 py-0 h-4 bg-gray-50 text-gray-600 border-gray-200">
                                      Manual renewal
                                    </Badge>
                                  )}
                                  
                                  {product.renewalPrice && (
                                    <Badge variant="outline" className="px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-200">
                                      <Tag className="h-2.5 w-2.5 mr-0.5" />
                                      ${product.renewalPrice}/yr
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="divide-y p-4 space-y-3">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div key={product.id} className="border rounded-md p-3 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-gray-50">
                            {productIcons[product.type]}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.details}</p>
                          </div>
                        </div>
                        {getStatusBadge(product.status)}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-600 mt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {product.expiryDate ? (
                            `Expires: ${product.expiryDate.toLocaleDateString()}`
                          ) : (
                            "No expiration date"
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {product.autoRenew ? (
                            <Badge variant="outline" className="px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                              <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                              Auto-renew
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="px-1.5 py-0 h-4 bg-gray-50 text-gray-600 border-gray-200">
                              Manual renewal
                            </Badge>
                          )}
                          
                          {product.renewalPrice && (
                            <Badge variant="outline" className="px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-200">
                              <Tag className="h-2.5 w-2.5 mr-0.5" />
                              ${product.renewalPrice}/yr
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-gray-100 rounded-full mb-3">
                        <Info className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-700">No {activeTab} products</h3>
                      <p className="text-xs text-gray-500 mt-1 max-w-md">
                        This client doesn't have any {activeTab} products or services.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-white border-t p-4 flex justify-between">
        <Button variant="outline" size="sm" className="text-xs h-8 shadow-sm">
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
          Add Product
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 shadow-sm">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Manage
          </Button>
          <Button variant="default" size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 shadow-sm">
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            Get Support
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}