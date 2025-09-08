'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Target, 
  AlertCircle,
  BarChart3,
  Wallet,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
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

export default function DashboardPage() {
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
      const data = await apiClient.getInvestments() as {
        investments: Investment[];
        portfolio: Portfolio;
      };
      setInvestments(data.investments);
      setPortfolio(data.portfolio);
    } catch (error) {
      toast.error('Error loading investments');
    } finally {
      setLoading(false);
    }
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
            <CardDescription>Please log in to access your dashboard</CardDescription>
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

  const riskColors = {
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#ef4444'
  };

  const typeColors = {
    bond: '#3b82f6',
    fd: '#8b5cf6',
    mf: '#06b6d4',
    etf: '#f59e0b',
    other: '#6b7280'
  };

  const riskData = Object.entries(portfolio?.riskDistribution || {}).map(([risk, amount]) => ({
    name: risk.charAt(0).toUpperCase() + risk.slice(1),
    value: amount,
    color: riskColors[risk as keyof typeof riskColors]
  }));

  const typeData = Object.entries(portfolio?.typeDistribution || {}).map(([type, amount]) => ({
    name: type.toUpperCase(),
    value: amount,
    color: typeColors[type as keyof typeof typeColors]
  }));

  const recentInvestments = investments.slice(0, 5);

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
            <span className="text-sm text-gray-600">Welcome, {user.firstName}</span>
            <Badge variant="outline">{user.riskAppetite} Risk</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Portfolio Overview */}
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
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user.riskAppetite}</div>
              <p className="text-xs text-muted-foreground">
                Your risk preference
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="mb-8">
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

        {/* Charts and Recent Investments */}
        <Tabs defaultValue="investments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="investments">Recent Investments</TabsTrigger>
            <TabsTrigger value="charts">Portfolio Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Investments</CardTitle>
                <CardDescription>
                  Your latest investment activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentInvestments.length > 0 ? (
                  <div className="space-y-4">
                    {recentInvestments.map((investment) => (
                      <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{investment.product.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {investment.product.investmentType.toUpperCase()} • {investment.product.riskLevel} Risk
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{investment.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {investment.product.annualYield}% yield
                          </p>
                        </div>
                      </div>
                    ))}
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

          <TabsContent value="charts" className="space-y-4">
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
        </Tabs>
      </div>
    </div>
  );
}
