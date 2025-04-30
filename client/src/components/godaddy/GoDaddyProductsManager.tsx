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
  RefreshCw
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
      name: 'Web Hosting Plus',
      description: 'High-performance hosting with unlimited storage',
      type: 'hosting',
      price: 9.99,
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
      name: 'SSL Certificate',
      description: 'Premium SSL protection for secure transactions',
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                GoDaddy Products
              </CardTitle>
              <CardDescription>
                Manage your client's digital products
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => setPurchaseDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Add Products
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expiring">Expiring</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
            </TabsList>
            
            <div className="space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-6 px-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No products found in this category</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => setPurchaseDialogOpen(true)}
                  >
                    Browse available products
                  </Button>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      setOpenDialog(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded-md">
                          {product.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.description}</p>
                          {product.expiryDate && (
                            <div className="mt-1">
                              {getStatusBadge(product.status, product.expiryDate)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${product.price.toFixed(2)}/year</p>
                        {product.expiryDate && (
                          <p className="text-xs text-gray-500">Renews: {new Date(product.expiryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    
                    {product.status === 'expiring' && product.expiryDate && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Expires soon</span>
                          <span>Renew now</span>
                        </div>
                        <Progress 
                          value={Math.min(100, 100 - (getDaysRemaining(product.expiryDate) || 0) / 90 * 100)} 
                          className="h-2" 
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Tabs>
        </CardContent>
        
        {cartItems.length > 0 && (
          <CardFooter className="border-t p-4 bg-gray-50">
            <div className="w-full">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Cart Total</p>
                <p className="font-semibold">${cartTotal.toFixed(2)}/year</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{cartItems.length} item(s) in cart</p>
                <Button size="sm" className="mt-2">Checkout</Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Product detail dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-medium">${selectedProduct.price.toFixed(2)}/year</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedProduct.status, selectedProduct.expiryDate)}
                  </div>
                </div>
              </div>
              
              {selectedProduct.expiryDate && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-500">Expiry Date</p>
                    <p className="text-xs font-medium">
                      {new Date(selectedProduct.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {selectedProduct.status === 'expiring' && (
                    <div className="mt-2">
                      <Progress 
                        value={Math.min(100, 100 - (getDaysRemaining(selectedProduct.expiryDate) || 0) / 90 * 100)} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">
                          {getDaysRemaining(selectedProduct.expiryDate)} days left
                        </span>
                        <span className="text-blue-600 font-medium">Renew now</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex sm:justify-between items-center">
            {selectedProduct?.status === 'active' || selectedProduct?.status === 'expiring' ? (
              <Button variant="outline" className="flex items-center gap-1" onClick={() => setOpenDialog(false)}>
                <RefreshCw className="h-4 w-4" />
                Renew
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => {
                  if (selectedProduct) addToCart(selectedProduct);
                  setOpenDialog(false);
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            )}
            <Button variant="ghost" onClick={() => setOpenDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Purchase new products dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add GoDaddy Products</DialogTitle>
            <DialogDescription>
              Select products to add to {client.name}'s account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer flex items-start gap-3"
                onClick={() => {
                  const newProduct: GoDaddyProduct = {
                    id: '5',
                    name: 'Premium SSL Certificate',
                    description: 'Enhanced website security with extended validation',
                    type: 'security',
                    price: 119.99,
                    status: 'recommended',
                    icon: <Shield className="h-5 w-5 text-red-500" />
                  };
                  addToCart(newProduct);
                }}
              >
                <div className="p-2 bg-gray-50 rounded-md">
                  <Shield className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium">Premium SSL Certificate</h3>
                  <p className="text-sm text-gray-500">Enhanced website security with extended validation</p>
                  <p className="font-medium mt-1">$119.99/year</p>
                </div>
              </div>
              
              <div 
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer flex items-start gap-3"
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
                <div className="p-2 bg-gray-50 rounded-md">
                  <Mail className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-medium">Business Email Pro</h3>
                  <p className="text-sm text-gray-500">10 professional email accounts with 100GB storage each</p>
                  <p className="font-medium mt-1">$9.99/year</p>
                </div>
              </div>
              
              <div 
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer flex items-start gap-3"
                onClick={() => {
                  const newProduct: GoDaddyProduct = {
                    id: '7',
                    name: 'Enterprise Hosting',
                    description: 'Dedicated server with unlimited bandwidth',
                    type: 'hosting',
                    price: 29.99,
                    status: 'recommended',
                    icon: <Server className="h-5 w-5 text-green-500" />
                  };
                  addToCart(newProduct);
                }}
              >
                <div className="p-2 bg-gray-50 rounded-md">
                  <Server className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium">Enterprise Hosting</h3>
                  <p className="text-sm text-gray-500">Dedicated server with unlimited bandwidth</p>
                  <p className="font-medium mt-1">$29.99/year</p>
                </div>
              </div>
              
              <div 
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer flex items-start gap-3"
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
                <div className="p-2 bg-gray-50 rounded-md">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium">Domain Privacy</h3>
                  <p className="text-sm text-gray-500">Protect your personal information from public WHOIS directories</p>
                  <p className="font-medium mt-1">$9.99/year</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPurchaseDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}