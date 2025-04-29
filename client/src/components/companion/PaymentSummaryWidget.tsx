import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
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
    <Card className={`border-2 shadow-lg overflow-hidden ${className}`}>
      <CardHeader className="bg-primary text-primary-foreground pb-4">
        <CardTitle className="text-xl font-bold text-center">
          Project Payment Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium">Project Total:</div>
          <div className="text-lg font-bold text-right">{formatCurrency(projectValue)}</div>
          
          {carePlanMonthly > 0 && (
            <>
              <div className="text-sm font-medium">Website Care Plan:</div>
              <div className="text-right">{formatCurrency(carePlanMonthly)}<span className="text-xs text-muted-foreground"> /month</span></div>
            </>
          )}
          
          {productsMonthly > 0 && (
            <>
              <div className="text-sm font-medium">GoDaddy Products:</div>
              <div className="text-right">{formatCurrency(productsMonthly)}<span className="text-xs text-muted-foreground"> /month</span></div>
            </>
          )}
          
          {totalMonthly > 0 && (
            <>
              <div className="border-t col-span-2 mt-2 pt-2"></div>
              <div className="text-sm font-medium">Total Monthly:</div>
              <div className="text-lg font-bold text-right">{formatCurrency(totalMonthly)}<span className="text-xs text-muted-foreground"> /month</span></div>
            </>
          )}
        </div>
        
        <div className="pt-2 space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Secure payment processing
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Check className="h-4 w-4 mr-2 text-green-500" />
            No hidden fees
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Cancel monthly services anytime
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/50 flex justify-center pt-4 pb-4">
        <Button onClick={handlePayClick} className="w-full">
          Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}