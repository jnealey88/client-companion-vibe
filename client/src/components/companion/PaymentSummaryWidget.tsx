import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentSummaryWidgetProps {
  projectValue: number;
  carePlanMonthly?: number;
  productsMonthly?: number;
  onPayClick?: () => void;
  className?: string;
}

export default function PaymentSummaryWidget({
  projectValue,
  carePlanMonthly = 0,
  productsMonthly = 0,
  onPayClick,
  className = ''
}: PaymentSummaryWidgetProps) {
  const totalMonthly = carePlanMonthly + productsMonthly;
  
  const handlePayClick = () => {
    if (onPayClick) {
      onPayClick();
    } else {
      // Default behavior
      window.open('https://example.com/payment', '_blank');
    }
  };

  return (
    <Card className={`shadow-lg overflow-hidden ${className}`}>
      <CardHeader className="bg-black text-white py-4">
        <CardTitle className="text-xl font-bold text-center">
          Project Payment Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 pb-2 space-y-4">
        <div>
          <div className="flex justify-between items-center border-b pb-3">
            <div className="font-medium">Project Total:</div>
            <div className="text-2xl font-bold">{formatCurrency(projectValue)}</div>
          </div>
          
          {carePlanMonthly > 0 && (
            <div className="flex justify-between items-center border-b py-3">
              <div className="font-medium">Website Care Plan:</div>
              <div>
                {formatCurrency(carePlanMonthly)}
                <span className="text-sm text-muted-foreground"> /month</span>
              </div>
            </div>
          )}
          
          {productsMonthly > 0 && (
            <div className="flex justify-between items-center border-b py-3">
              <div className="font-medium">GoDaddy Products:</div>
              <div>
                {formatCurrency(productsMonthly)}
                <span className="text-sm text-muted-foreground"> /month</span>
              </div>
            </div>
          )}
          
          {totalMonthly > 0 && (
            <div className="flex justify-between items-center pt-3">
              <div className="font-medium">Total Monthly:</div>
              <div className="text-xl font-bold">
                {formatCurrency(totalMonthly)}
                <span className="text-sm text-muted-foreground"> /month</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 space-y-3">
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
            <span>Secure payment processing</span>
          </div>
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
            <span>No hidden fees</span>
          </div>
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
            <span>Cancel monthly services anytime</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="py-4">
        <Button onClick={handlePayClick} className="w-full bg-black hover:bg-gray-800">
          Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}