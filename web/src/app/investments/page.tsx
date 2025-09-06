'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Target, 
  Clock,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import Link from 'next/link';
import { toast } from 'sonner';

interface Investment {
  id: string;
  amount: number;
  investedAt: string;
  status: string;
  expectedReturn: number;
  maturityDate: string;
  product: {
    id: string;
    name: string;
    investmentType: string;
    annualYield: number;
    riskLevel: string;
    tenureMonths: number;
  };
}

interface Portfolio {
  totalInvested: number;
  totalExpectedReturn: number;
  activeInvestmentsCount: number;
  riskDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  averageYield: number;
}

export default function InvestmentsPage() {
  const { user, token } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchInvestments();
    }
  }, [token]);

  const fetchInvestments = async () => {
    try {
      const data = await apiClient.getInvestments();
      setInvestments(data.investments);
      setPortfolio(data.portfolio);
    } catch (error) {
      toast.error('Error loading investments');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'matured': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your investments</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const riskData = Object.entries(portfolio?.riskDistribution || {}).map(([risk, amount]) => ({
    name: risk.charAt(0).toUpperCase() + risk.slice(1),
    value: amount,
    color: getRiskColor(risk).includes('green') ? '#10b981' : 
           getRiskColor(risk).includes('yellow') ? '#f59e0b' : '#ef4444'
  }));

  const typeData = Object.entries(portfolio?.typeDistribution || {}).map(([type, amount]) => ({
    name: type.toUpperCase(),
    value: amount,
    color: getTypeColor(type).includes('blue') ? '#3b82f6' :
           getTypeColor(type).includes('purple') ? '#8b5cf6' :
           getTypeColor(type).includes('cyan') ? '#06b6d4' :
           getTypeColor(type).includes('orange') ? '#f59e0b' : '#6b7280'
  }));

  const monthlyInvestments = investments.reduce((acc, investment) => {
    const month = new Date(investment.investedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += investment.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(monthlyInvestments).map(([month, amount]) => ({
    month,
    amount
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Grip Invest</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost">Browse Products</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Investments</h1>
          <p className="text-gray-600">
            Track and manage your investment portfolio
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{portfolio?.totalInvested.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across {portfolio?.activeInvestmentsCount || 0} investments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected Returns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{portfolio?.totalExpectedReturn.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                {portfolio?.averageYield.toFixed(2) || 0}% average yield
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio?.activeInvestmentsCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{((portfolio?.totalInvested || 0) + (portfolio?.totalExpectedReturn || 0)).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Including expected returns
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
            <TabsTrigger value="investments">All Investments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* AI Portfolio Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>AI Portfolio Insights</span>
                </CardTitle>
                <CardDescription>
                  Intelligent analysis of your investment portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Risk Distribution</h4>
                    <div className="space-y-2">
                      {riskData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">
                            ₹{item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Investment Types</h4>
                    <div className="space-y-2">
                      {typeData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">
                            ₹{item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>Your portfolio risk allocation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investment Types</CardTitle>
                  <CardDescription>Distribution by investment type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="investments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Investments</CardTitle>
                <CardDescription>
                  Complete list of your investment activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {investments.length > 0 ? (
                  <div className="space-y-4">
                    {investments.map((investment) => {
                      const daysUntilMaturity = getDaysUntilMaturity(investment.maturityDate);
                      return (
                        <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{investment.product.name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getTypeColor(investment.product.investmentType)}>
                                  {investment.product.investmentType.toUpperCase()}
                                </Badge>
                                <Badge className={getRiskColor(investment.product.riskLevel)}>
                                  {investment.product.riskLevel}
                                </Badge>
                                <Badge className={getStatusColor(investment.status)}>
                                  {investment.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Invested on {formatDate(investment.investedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{investment.amount.toLocaleString()}</p>
                            <p className="text-sm text-green-600">
                              +₹{investment.expectedReturn.toLocaleString()} expected
                            </p>
                            <p className="text-xs text-gray-500">
                              Matures in {daysUntilMaturity} days
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start your investment journey by exploring our products
                    </p>
                    <Link href="/products">
                      <Button>Browse Products</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Investment Analytics</CardTitle>
                <CardDescription>
                  Track your investment performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount Invested']} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
