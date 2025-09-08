'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Filter, 
  Search, 
  Star, 
  Zap, 
  Shield, 
  Clock,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
  createdAt: string;
}

export default function ProductsPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InvestmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, typeFilter, riskFilter, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts({
        sortBy,
        sortOrder,
      }) as {
        products: InvestmentProduct[];
      };
      setProducts(data.products);
    } catch (error) {
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(product => product.investmentType === typeFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(product => product.riskLevel === riskFilter);
    }

    setFilteredProducts(filtered);
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

  const getAIRecommendation = (product: InvestmentProduct) => {
    if (!user) return null;

    const userRisk = user.riskAppetite;
    const productRisk = product.riskLevel;
    const annualYield = product.annualYield;

    if (userRisk === 'low' && productRisk === 'low' && annualYield >= 6) {
      return { type: 'excellent', message: 'Perfect match for your risk profile!' };
    }
    if (userRisk === 'moderate' && productRisk === 'moderate' && annualYield >= 8) {
      return { type: 'good', message: 'Great balance of risk and return' };
    }
    if (userRisk === 'high' && productRisk === 'high' && annualYield >= 10) {
      return { type: 'excellent', message: 'High-risk, high-reward opportunity' };
    }
    if (userRisk === 'low' && productRisk === 'high') {
      return { type: 'warning', message: 'Higher risk than your preference' };
    }
    if (userRisk === 'high' && productRisk === 'low') {
      return { type: 'info', message: 'Lower risk than your preference' };
    }
    return { type: 'neutral', message: 'Consider your risk tolerance' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/investments">
              <Button variant="ghost">My Investments</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Investment Products</h1>
          <p className="text-gray-600">
            Discover and invest in our curated selection of investment products
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Investment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bond">Bonds</SelectItem>
                  <SelectItem value="fd">Fixed Deposits</SelectItem>
                  <SelectItem value="mf">Mutual Funds</SelectItem>
                  <SelectItem value="etf">ETFs</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="moderate">Moderate Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Added</SelectItem>
                  <SelectItem value="yield">Annual Yield</SelectItem>
                  <SelectItem value="tenure">Tenure</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const recommendation = getAIRecommendation(product);
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {product.description}
                      </CardDescription>
                    </div>
                    {recommendation && (
                      <Badge 
                        variant={
                          recommendation.type === 'excellent' ? 'default' :
                          recommendation.type === 'good' ? 'secondary' :
                          recommendation.type === 'warning' ? 'destructive' : 'outline'
                        }
                        className="ml-2"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getTypeColor(product.investmentType)}>
                      {product.investmentType.toUpperCase()}
                    </Badge>
                    <Badge className={getRiskColor(product.riskLevel)}>
                      {product.riskLevel} Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{product.annualYield}% yield</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{product.tenureMonths} months</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min Investment:</span>
                      <span className="font-medium">₹{product.minInvestment.toLocaleString()}</span>
                    </div>
                    {product.maxInvestment && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Max Investment:</span>
                        <span className="font-medium">₹{product.maxInvestment.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {recommendation && (
                    <div className={`p-3 rounded-lg text-sm ${
                      recommendation.type === 'excellent' ? 'bg-green-50 text-green-700' :
                      recommendation.type === 'good' ? 'bg-blue-50 text-blue-700' :
                      recommendation.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">AI Insight:</span>
                      </div>
                      <p className="mt-1">{recommendation.message}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{product.name}</DialogTitle>
                          <DialogDescription>
                            Detailed information about this investment product
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Product Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Type:</span>
                                  <Badge className={getTypeColor(product.investmentType)}>
                                    {product.investmentType.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Risk Level:</span>
                                  <Badge className={getRiskColor(product.riskLevel)}>
                                    {product.riskLevel}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Annual Yield:</span>
                                  <span className="font-medium">{product.annualYield}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tenure:</span>
                                  <span className="font-medium">{product.tenureMonths} months</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Investment Range</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Minimum:</span>
                                  <span className="font-medium">₹{product.minInvestment.toLocaleString()}</span>
                                </div>
                                {product.maxInvestment && (
                                  <div className="flex justify-between">
                                    <span>Maximum:</span>
                                    <span className="font-medium">₹{product.maxInvestment.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-gray-600">{product.description}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {user ? (
                      <Link href={`/invest?productId=${product.id}`}>
                        <Button className="flex-1">
                          Invest Now
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/login">
                        <Button className="flex-1">
                          Login to Invest
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <img src="/favicon.ico" alt="No products found" className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
