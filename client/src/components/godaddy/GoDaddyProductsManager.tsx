import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Globe, 
  Server, 
  Mail, 
  Shield, 
  PlusCircle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Client } from '@shared/schema';

// Define product types
interface GoDaddyProduct {
  id: string;
  name: string;
  description: string;
  type: 'domain' | 'hosting' | 'email' | 'security' | 'marketing';
  price: number;
  status: 'active' | 'inactive' | 'expiring' | 'recommended';
  expiryDate?: string;
  icon: React.ReactNode;
}

// Interface for props
interface GoDaddyProductsManagerProps {
  client: Client;
}

export default function GoDaddyProductsManager({ client }: GoDaddyProductsManagerProps) {
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedProduct, setSelectedProduct] = useState<GoDaddyProduct | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [cartItems, setCartItems] = useState<GoDaddyProduct[]>([]);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  
  // Sample data - in a real app, this would come from an API
  const mockProducts: GoDaddyProduct[] = [
    {
      id: '1',
      name: 'Business Domain',
      description: client.websiteUrl || 'Primary business domain',
      type: 'domain',
      price: 14.99,
      status: 'active',
      expiryDate: '2025-07-15',
      icon: <Globe className="h-5 w-5 text-blue-500" />
    },
    {
      id: '2',
      name: 'Managed WordPress Ultimate',
      description: 'Premium WordPress hosting with advanced features and security',
      type: 'hosting',
      price: 249.00,
      status: 'active',
      expiryDate: '2025-05-10',
      icon: <Server className="h-5 w-5 text-green-500" />
    },
    {
      id: '3',
      name: 'Business Email',
      description: '5 professional email accounts with 50GB storage each',
      type: 'email',
      price: 5.99,
      status: 'expiring',
      expiryDate: '2025-06-01',
      icon: <Mail className="h-5 w-5 text-purple-500" />
    },
    {
      id: '4',
      name: 'Website Security',
      description: 'Complete website protection with malware scanning and removal',
      type: 'security',
      price: 69.99,
      status: 'recommended',
      icon: <Shield className="h-5 w-5 text-red-500" />
    }
  ];
  
  // Filter products based on selected tab
  const filteredProducts = mockProducts.filter(product => {
    if (selectedTab === 'active') return product.status === 'active';
    if (selectedTab === 'expiring') return product.status === 'expiring';
    if (selectedTab === 'recommended') return product.status === 'recommended';
    return true;
  });
  
  // Handle adding product to cart
  const addToCart = (product: GoDaddyProduct) => {
    setCartItems([...cartItems, product]);
    setPurchaseDialogOpen(false);
  };
  
  // Handle removing product from cart
  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };
  
  // Calculate total cart price
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);
  
  // Calculate days remaining until expiry
  const getDaysRemaining = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Get status badge for a product
  const getStatusBadge = (status: string, expiryDate?: string) => {
    const daysRemaining = expiryDate ? getDaysRemaining(expiryDate) : null;
    
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </Badge>
        );
      case 'expiring':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" /> 
            {daysRemaining ? `Expires in ${daysRemaining} days` : 'Expiring soon'}
          </Badge>
        );
      case 'recommended':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <PlusCircle className="h-3 w-3 mr-1" /> Recommended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // Group products by type
  const domainProducts = mockProducts.filter(p => p.type === 'domain' && p.status === 'active');
  const hostingProducts = mockProducts.filter(p => p.type === 'hosting' && p.status === 'active');
  const emailProducts = mockProducts.filter(p => p.type === 'email' && p.status === 'active');
  const securityProducts = mockProducts.filter(p => p.type === 'security');
  
  // Check if security is active
  const hasActiveSecurity = securityProducts.some(p => p.status === 'active');
  
  // Count active products
  const activeProductsCount = mockProducts.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">
                Active Products
              </CardTitle>
              <CardDescription className="text-base text-gray-600 mt-1">
                {activeProductsCount} active product{activeProductsCount !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setPurchaseDialogOpen(true)}
            >
              Add Products
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Domains Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-medium">Domains</h3>
                  <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">
                    {domainProducts.length} Active
                  </Badge>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                {domainProducts.map(domain => (
                  <div key={domain.id} className="bg-white p-3 rounded-md border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{client.websiteUrl || "techvision.example.com"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        Active
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {domainProducts.length === 0 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">No domains registered</p>
                  </div>
                )}
              </div>
            </div>

            {/* Hosting Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-medium">Hosting</h3>
                  <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">
                    {hostingProducts.length} Active
                  </Badge>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                {hostingProducts.map(hosting => (
                  <div key={hosting.id} className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{hosting.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Renews {hosting.expiryDate ? new Date(hosting.expiryDate).toLocaleDateString(undefined, {
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'Feb 1, 2024'}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {hostingProducts.length === 0 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">No hosting plans active</p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Section */}
            <div className={`${hasActiveSecurity ? 'bg-gray-50' : 'bg-amber-50'} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-medium">Security</h3>
                  {hasActiveSecurity ? (
                    <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">
                      Protected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-800 border-amber-200">
                      Not Protected
                    </Badge>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              {!hasActiveSecurity && (
                <div>
                  <p className="text-gray-700 mb-3">Essential protection needed for your website</p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const securityProduct = securityProducts.find(p => p.status === 'recommended');
                      if (securityProduct) {
                        setSelectedProduct(securityProduct);
                        setOpenDialog(true);
                      } else {
                        setPurchaseDialogOpen(true);
                      }
                    }}
                  >
                    View Security Bundle
                  </Button>
                </div>
              )}

              {hasActiveSecurity && (
                <div className="bg-white p-3 rounded-md border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Website Security</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Essential protection active
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      Active
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Email Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-700" />
                  <h3 className="text-lg font-medium">Email</h3>
                  <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">
                    {emailProducts.length > 0 ? `${emailProducts.length * 5} Mailboxes` : '0 Mailboxes'}
                  </Badge>
                </div>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                {emailProducts.map(email => (
                  <div key={email.id} className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{email.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          5 professional email accounts
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {emailProducts.length === 0 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">No email plans active</p>
                    <Button 
                      variant="link" 
                      className="text-blue-600"
                      onClick={() => setPurchaseDialogOpen(true)}
                    >
                      Add Email Plan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        {cartItems.length > 0 && (
          <CardFooter className="border-t p-4 bg-gradient-to-b from-gray-50 to-white">
            <div className="w-full">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Cart Total</p>
                  <p className="text-xs text-gray-500">{cartItems.length} product{cartItems.length > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-blue-700">${cartTotal.toFixed(2)}<span className="text-sm text-gray-500 font-normal">/year</span></p>
                  {cartTotal > 100 && (
                    <p className="text-xs text-green-600 font-medium">Save 10% with annual billing</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  size="sm" 
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Proceed to Checkout
                </Button>
                <div className="flex justify-center mt-2">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs text-gray-500"
                    onClick={() => setCartItems([])}
                  >
                    Clear cart
                  </Button>
                </div>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Product detail dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedProduct && (
                <div className={`p-2.5 rounded-full ${
                  selectedProduct.type === 'domain' ? 'bg-blue-100 text-blue-600' :
                  selectedProduct.type === 'hosting' ? 'bg-green-100 text-green-600' :
                  selectedProduct.type === 'email' ? 'bg-purple-100 text-purple-600' :
                  selectedProduct.type === 'security' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {selectedProduct.icon}
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">{selectedProduct?.name}</DialogTitle>
                <DialogDescription>
                  {selectedProduct?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-5 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Price</p>
                  <p className="font-semibold text-gray-900 mt-1">${selectedProduct.price.toFixed(2)}<span className="text-gray-500 font-normal text-sm">/year</span></p>
                  {selectedProduct.price > 100 && (
                    <p className="text-xs text-green-600 font-medium mt-1">Save 10% with annual billing</p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Status</p>
                  <div className="mt-2">
                    {getStatusBadge(selectedProduct.status, selectedProduct.expiryDate)}
                  </div>
                </div>
              </div>
              
              {selectedProduct.expiryDate && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Expiry Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedProduct.expiryDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {selectedProduct.status === 'expiring' && (
                    <div className="mt-3">
                      <Progress 
                        value={Math.min(100, 100 - (getDaysRemaining(selectedProduct.expiryDate) || 0) / 90 * 100)} 
                        className="h-2 bg-gray-200" 
                      />
                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-amber-600 font-medium">
                          {getDaysRemaining(selectedProduct.expiryDate)} days remaining
                        </span>
                        <span className="text-blue-600 font-medium underline cursor-pointer">Renew now</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Benefits section */}
              <div className="p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium mb-3">Product Benefits</h4>
                <ul className="space-y-2">
                  {selectedProduct.type === 'domain' && (
                    <>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Domain renewal for 1 year</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Free email forwarding</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Domain theft protection</span>
                      </li>
                    </>
                  )}
                  
                  {selectedProduct.type === 'hosting' && (
                    <>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Unlimited websites</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Unlimited storage</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Free SSL certificate</span>
                      </li>
                    </>
                  )}
                  
                  {selectedProduct.type === 'security' && (
                    <>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Malware removal & cleanup</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Continuous security monitoring</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>CDN performance boost</span>
                      </li>
                    </>
                  )}
                  
                  {selectedProduct.type === 'email' && (
                    <>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Professional email addresses</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Large mailbox storage</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Calendar and contacts sync</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex sm:justify-between items-center mt-4">
            {selectedProduct?.status === 'active' || selectedProduct?.status === 'expiring' ? (
              <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1" onClick={() => setOpenDialog(false)}>
                <RefreshCw className="h-4 w-4" />
                Renew Now
              </Button>
            ) : (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                onClick={() => {
                  if (selectedProduct) addToCart(selectedProduct);
                  setOpenDialog(false);
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Purchase new products dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-xl">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Add GoDaddy Products
            </DialogTitle>
            <DialogDescription>
              Recommended products for {client.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                onClick={() => {
                  const newProduct: GoDaddyProduct = {
                    id: '5',
                    name: 'Website Security Essential',
                    description: 'Complete website protection with malware scanning and removal',
                    type: 'security',
                    price: 119.99,
                    status: 'recommended',
                    icon: <Shield className="h-5 w-5 text-red-500" />
                  };
                  addToCart(newProduct);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full w-fit">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-gray-900 mt-4">Website Security Essential</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">Complete website protection with malware scanning and removal</p>
                    <div className="flex items-center mt-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <PlusCircle className="h-3 w-3 mr-1" /> Recommended
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold">$119.99<span className="text-gray-500 font-normal text-sm">/year</span></p>
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newProduct: GoDaddyProduct = {
                      id: '5',
                      name: 'Website Security Essential',
                      description: 'Complete website protection with malware scanning and removal',
                      type: 'security',
                      price: 119.99,
                      status: 'recommended',
                      icon: <Shield className="h-5 w-5 text-red-500" />
                    };
                    addToCart(newProduct);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
              
              <div 
                className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                onClick={() => {
                  const newProduct: GoDaddyProduct = {
                    id: '6',
                    name: 'Business Email Pro',
                    description: '10 professional email accounts with 100GB storage each',
                    type: 'email',
                    price: 9.99,
                    status: 'recommended',
                    icon: <Mail className="h-5 w-5 text-purple-500" />
                  };
                  addToCart(newProduct);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-full w-fit">
                      <Mail className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-gray-900 mt-4">Business Email Pro</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">10 professional email accounts with 100GB storage each</p>
                    <div className="flex items-center mt-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <PlusCircle className="h-3 w-3 mr-1" /> Recommended
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold">$9.99<span className="text-gray-500 font-normal text-sm">/year</span></p>
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newProduct: GoDaddyProduct = {
                      id: '6',
                      name: 'Business Email Pro',
                      description: '10 professional email accounts with 100GB storage each',
                      type: 'email',
                      price: 9.99,
                      status: 'recommended',
                      icon: <Mail className="h-5 w-5 text-purple-500" />
                    };
                    addToCart(newProduct);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
              
              <div 
                className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer" 
                onClick={() => {
                  const newProduct: GoDaddyProduct = {
                    id: '7',
                    name: 'Business WordPress Pro',
                    description: 'Managed WordPress with premium themes and advanced security',
                    type: 'hosting',
                    price: 249.00,
                    status: 'recommended',
                    icon: <Server className="h-5 w-5 text-green-500" />
                  };
                  addToCart(newProduct);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full w-fit">
                      <Server className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-gray-900 mt-4">Business WordPress Pro</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">Managed WordPress with premium themes and advanced security</p>
                    <div className="flex items-center mt-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <PlusCircle className="h-3 w-3 mr-1" /> Recommended
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold">$249.00<span className="text-gray-500 font-normal text-sm">/year</span></p>
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newProduct: GoDaddyProduct = {
                      id: '7',
                      name: 'Business WordPress Pro',
                      description: 'Managed WordPress with premium themes and advanced security',
                      type: 'hosting',
                      price: 249.00,
                      status: 'recommended',
                      icon: <Server className="h-5 w-5 text-green-500" />
                    };
                    addToCart(newProduct);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
              
              <div 
                className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                onClick={() => {
                  const newProduct: GoDaddyProduct = {
                    id: '8',
                    name: 'Domain Privacy',
                    description: 'Protect your personal information from public WHOIS directories',
                    type: 'security',
                    price: 9.99,
                    status: 'recommended',
                    icon: <Shield className="h-5 w-5 text-blue-500" />
                  };
                  addToCart(newProduct);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full w-fit">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium text-gray-900 mt-4">Domain Privacy</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">Protect your personal information from public WHOIS directories</p>
                    <div className="flex items-center mt-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <PlusCircle className="h-3 w-3 mr-1" /> Recommended
                      </Badge>
                    </div>
                  </div>
                  <p className="font-semibold">$9.99<span className="text-gray-500 font-normal text-sm">/year</span></p>
                </div>
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newProduct: GoDaddyProduct = {
                      id: '8',
                      name: 'Domain Privacy',
                      description: 'Protect your personal information from public WHOIS directories',
                      type: 'security',
                      price: 9.99,
                      status: 'recommended',
                      icon: <Shield className="h-5 w-5 text-blue-500" />
                    };
                    addToCart(newProduct);
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <p className="text-sm text-gray-500">Products selected for {client.name}'s account needs</p>
            <Button variant="ghost" onClick={() => setPurchaseDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}