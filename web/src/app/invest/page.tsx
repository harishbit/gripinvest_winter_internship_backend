'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Clock, 
  Target, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const investmentSchema = z.object({
  amount: z.number().min(1000, 'Minimum investment is ₹1000'),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface InvestmentProduct {
  id: string;
  name: string;
  investmentType: string;
  tenureMonths: number;
  annualYield: number;
  riskLevel: string;
  minInvestment: number;
  maxInvestment?: number;
  description: string;
}

function InvestPageContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [product, setProduct] = useState<InvestmentProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [calculatedReturn, setCalculatedReturn] = useState(0);

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      amount: 0,
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (productId) {
      fetchProduct();
    } else {
      router.push('/products');
    }
  }, [user, productId, router]);

  useEffect(() => {
    const amount = form.watch('amount');
    if (amount > 0 && product) {
      const annualYield = product.annualYield;
      const tenureMonths = product.tenureMonths;
      const expectedReturn = (amount * annualYield * tenureMonths) / (100 * 12);
      setCalculatedReturn(expectedReturn);
    }
  }, [form.watch('amount'), product]);

  const fetchProduct = async () => {
    if (!productId) {
      toast.error('Product ID is required');
      router.push('/products');
      return;
    }
    
    try {
      const data = await apiClient.getProduct(productId) as {
        product: InvestmentProduct;
      };
      setProduct(data.product);
      form.setValue('amount', data.product.minInvestment);
    } catch (error) {
      toast.error('Error loading product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: InvestmentFormData) => {
    if (!product || !token) return;

    setInvesting(true);
    try {
      const result = await apiClient.createInvestment({
        productId: product.id,
        amount: data.amount,
      });

      toast.success('Investment created successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Error creating investment');
    } finally {
      setInvesting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bond': return 'bg-blue-100 text-blue-800';
      case 'fd': return 'bg-purple-100 text-purple-800';
      case 'mf': return 'bg-cyan-100 text-cyan-800';
      case 'etf': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The requested product could not be found</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/favicon.ico" alt="Grip Invest" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Grip Invest</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/products">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {product.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getTypeColor(product.investmentType)}>
                      {product.investmentType.toUpperCase()}
                    </Badge>
                    <Badge className={getRiskColor(product.riskLevel)}>
                      {product.riskLevel} Risk
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{product.annualYield}%</div>
                    <div className="text-sm text-blue-600">Annual Yield</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{product.tenureMonths}</div>
                    <div className="text-sm text-green-600">Months</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Investment Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum Investment:</span>
                      <span className="font-medium">₹{product.minInvestment.toLocaleString()}</span>
                    </div>
                    {product.maxInvestment && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Maximum Investment:</span>
                        <span className="font-medium">₹{product.maxInvestment.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment Type:</span>
                      <span className="font-medium capitalize">{product.investmentType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <Badge className={getRiskColor(product.riskLevel)}>
                        {product.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please review all details carefully before investing. 
                    Past performance does not guarantee future results.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Investment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Make Investment</CardTitle>
                <CardDescription>
                  Enter the amount you want to invest in this product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Amount (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={investing}
                              min={product.minInvestment}
                              max={product.maxInvestment || undefined}
                            />
                          </FormControl>
                          <FormMessage />
                          <div className="text-sm text-gray-600">
                            Minimum: ₹{product.minInvestment.toLocaleString()}
                            {product.maxInvestment && ` • Maximum: ₹${product.maxInvestment.toLocaleString()}`}
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Investment Calculator */}
                    {form.watch('amount') > 0 && (
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <Calculator className="h-5 w-5" />
                            <span>Investment Calculator</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Principal Amount:</span>
                            <span className="font-medium">₹{form.watch('amount').toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Annual Yield:</span>
                            <span className="font-medium">{product.annualYield}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tenure:</span>
                            <span className="font-medium">{product.tenureMonths} months</span>
                          </div>
                          <div className="border-t pt-3">
                            <div className="flex justify-between text-lg font-semibold">
                              <span>Expected Return:</span>
                              <span className="text-green-600">₹{calculatedReturn.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Total Value at Maturity:</span>
                              <span>₹{(form.watch('amount') + calculatedReturn).toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={investing || form.watch('amount') < product.minInvestment}
                    >
                      {investing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Processing Investment...
                        </>
                      ) : (
                        <>
                          <Target className="h-4 w-4 mr-2" />
                          Invest Now
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <InvestPageContent />
    </Suspense>
  );
}
