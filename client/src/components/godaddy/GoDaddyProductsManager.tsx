import { useState } from "react";
import { Client } from "@shared/schema";
import { 
  Clock, 
  Globe, 
  Server, 
  Database, 
  Lock, 
  Search, 
  Mail, 
  Grid, 
  Plus,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GoDaddyProductsManagerProps {
  client: Client;
}

type ProductStatus = "active" | "expiring" | "expired" | "pending";

interface Product {
  id: string;
  name: string;
  type: string;
  category: "domain" | "hosting" | "email" | "security" | "other";
  status: ProductStatus;
  expiration?: string;
  price: number;
  renewalPrice?: number;
  features?: string[];
}

export default function GoDaddyProductsManager({ client }: GoDaddyProductsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Demo products data
  const products: Product[] = [
    {
      id: "d1",
      name: client.websiteUrl?.replace(/^https?:\/\//i, "") || "example.com",
      type: "Domain Name",
      category: "domain",
      status: "active",
      expiration: "2026-02-15",
      price: 14.99,
      renewalPrice: 17.99,
      features: ["WHOIS Privacy", "Auto-renewal", "DNS Management"]
    },
    {
      id: "h1",
      name: "Business Hosting",
      type: "Web Hosting",
      category: "hosting",
      status: "active",
      expiration: "2026-05-10",
      price: 7.99,
      renewalPrice: 9.99,
      features: ["20GB Storage", "Unlimited Bandwidth", "Free SSL"]
    },
    {
      id: "e1",
      name: "Business Email",
      type: "Professional Email",
      category: "email",
      status: "expiring",
      expiration: "2025-06-22",
      price: 5.99,
      renewalPrice: 6.99,
      features: ["10GB Storage", "Anti-spam", "Mobile access"]
    },
    {
      id: "s1",
      name: "SSL Certificate",
      type: "Security",
      category: "security",
      status: "active",
      expiration: "2026-02-15",
      price: 69.99,
      renewalPrice: 79.99,
      features: ["256-bit encryption", "Trust seal", "Malware scanning"]
    }
  ];

  // Filter products by search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
  
  // Helper for status badge
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 font-medium">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        );
      case "expiring":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3" />
            Expiring Soon
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 font-medium">
            <RefreshCw className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };
  
  // Helper for category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "domain":
        return <Globe className="h-5 w-5 text-indigo-600" />;
      case "hosting":
        return <Server className="h-5 w-5 text-emerald-600" />;
      case "email":
        return <Mail className="h-5 w-5 text-blue-600" />;
      case "security":
        return <Lock className="h-5 w-5 text-amber-600" />;
      default:
        return <Grid className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Helper for category names
  const getCategoryName = (category: string) => {
    switch (category) {
      case "domain":
        return "Domain Names";
      case "hosting":
        return "Web Hosting";
      case "email":
        return "Email & Productivity";
      case "security":
        return "Website Security";
      default:
        return "Other Products";
    }
  };
  
  // Calculate days until expiration
  const getDaysUntilExpiration = (expirationDate?: string) => {
    if (!expirationDate) return null;
    
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  return (
    <Card className="h-full overflow-hidden shadow-sm">
      <CardHeader className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-md">
            <Globe className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-lg">GoDaddy Products</CardTitle>
            <CardDescription>
              Manage domain, hosting, and other products
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <div className="border-b px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>
      
      <CardContent className="p-0 overflow-auto max-h-[calc(100vh-350px)]">
        <Tabs defaultValue="all" className="w-full p-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            {Object.keys(productsByCategory).length > 0 ? (
              <Accordion type="multiple" defaultValue={["domain", "hosting", "email", "security"]}>
                {Object.keys(productsByCategory).map(category => (
                  <AccordionItem key={category} value={category} className="border px-4 rounded-lg mb-4 border-gray-200 overflow-hidden">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category)}
                        <span className="font-medium">{getCategoryName(category)}</span>
                        <Badge variant="outline" className="ml-2 bg-gray-50">
                          {productsByCategory[category].length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-3">
                        {productsByCategory[category].map(product => (
                          <div 
                            key={product.id} 
                            className={`p-3 rounded-lg border ${product.status === 'active' ? 'border-green-100 bg-green-50/30' : 'border-gray-200'} hover:shadow-sm transition-all`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{product.name}</h4>
                                <p className="text-sm text-gray-500">{product.type}</p>
                              </div>
                              {getStatusBadge(product.status)}
                            </div>
                            
                            {product.expiration && (
                              <div className="mt-2 text-sm flex items-center">
                                <Clock className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                                <span className={`${getDaysUntilExpiration(product.expiration)! < 30 ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                                  Expires: {new Date(product.expiration).toLocaleDateString()}
                                  {getDaysUntilExpiration(product.expiration)! < 30 && getDaysUntilExpiration(product.expiration)! > 0 && 
                                    ` (${getDaysUntilExpiration(product.expiration)} days)`
                                  }
                                </span>
                              </div>
                            )}
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                              {product.features?.map((feature, index) => (
                                <Badge key={index} variant="outline" className="bg-white font-normal">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="mt-3 flex justify-between items-center">
                              <div>
                                <span className="text-sm font-medium">${product.price}/yr</span>
                                {product.renewalPrice && product.renewalPrice > product.price && (
                                  <span className="text-xs text-gray-500 ml-1.5">
                                    renews at ${product.renewalPrice}/yr
                                  </span>
                                )}
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7 px-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                              >
                                Manage
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found matching your search.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-6">
            {Object.keys(productsByCategory).map(category => {
              const activeProducts = productsByCategory[category].filter(p => p.status === "active");
              if (activeProducts.length === 0) return null;
              
              return (
                <div key={category} className="border p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category)}
                    <span className="font-medium">{getCategoryName(category)}</span>
                  </div>
                  
                  <div className="space-y-3 mt-2">
                    {activeProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="p-3 rounded-lg border border-green-100 bg-green-50/30 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.type}</p>
                          </div>
                          {getStatusBadge(product.status)}
                        </div>
                        
                        {product.expiration && (
                          <div className="mt-2 text-sm text-gray-500 flex items-center">
                            <Clock className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                            Expires: {new Date(product.expiration).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
          
          <TabsContent value="expiring" className="space-y-6">
            {Object.keys(productsByCategory).map(category => {
              const expiringProducts = productsByCategory[category].filter(p => 
                p.status === "expiring" || 
                (p.expiration && getDaysUntilExpiration(p.expiration)! < 30 && getDaysUntilExpiration(p.expiration)! > 0)
              );
              
              if (expiringProducts.length === 0) return null;
              
              return (
                <div key={category} className="border p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category)}
                    <span className="font-medium">{getCategoryName(category)}</span>
                  </div>
                  
                  <div className="space-y-3 mt-2">
                    {expiringProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="p-3 rounded-lg border border-amber-100 bg-amber-50/30 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.type}</p>
                          </div>
                          {getStatusBadge(product.status)}
                        </div>
                        
                        {product.expiration && (
                          <div className="mt-2 text-sm text-amber-600 font-medium flex items-center">
                            <Clock className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                            Expires in {getDaysUntilExpiration(product.expiration)} days
                            <span className="text-gray-500 font-normal ml-1">
                              ({new Date(product.expiration).toLocaleDateString()})
                            </span>
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                            Renew Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {!Object.keys(productsByCategory).some(category => 
              productsByCategory[category].some(p => 
                p.status === "expiring" || 
                (p.expiration && getDaysUntilExpiration(p.expiration)! < 30 && getDaysUntilExpiration(p.expiration)! > 0)
              )
            ) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No products expiring soon.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t p-4 flex justify-between bg-white">
        <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5">
          <Database className="h-3.5 w-3.5" />
          Manage All Products
        </Button>
        <Button size="sm" className="text-xs h-7 bg-red-600 hover:bg-red-700 text-white gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add New Product
        </Button>
      </CardFooter>
    </Card>
  );
}