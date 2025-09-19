'use client';

import { useState, useEffect } from 'react';
import { adminApiClient, type Product, type CreateProductData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Package, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Shield,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [createForm, setCreateForm] = useState<CreateProductData>({
    name: '',
    investmentType: 'bond',
    tenureMonths: 12,
    annualYield: 0,
    riskLevel: 'low',
    minInvestment: 1000,
    maxInvestment: undefined,
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchProducts();
    }
  }, [authenticated]);

  const checkAuth = () => {
    const isAuth = adminApiClient.isAuthenticated();
    setAuthenticated(isAuth);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await adminApiClient.login(loginForm.email, loginForm.password);
      setAuthenticated(true);
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleLogout = () => {
    adminApiClient.logout();
    setAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const fetchProducts = async () => {
    try {
      const data = await adminApiClient.getProducts();
      setProducts(data.products);
    } catch (error) {
      toast.error('Error loading products');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);

    try {
      await adminApiClient.createProduct(createForm);
      toast.success('Product created successfully');
      setShowCreateDialog(false);
      resetCreateForm();
      fetchProducts();
    } catch (error) {
      toast.error('Error creating product');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await adminApiClient.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Error deleting product');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      investmentType: 'bond',
      tenureMonths: 12,
      annualYield: 0,
      riskLevel: 'low',
      minInvestment: 1000,
      maxInvestment: undefined,
      description: '',
    });
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

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
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
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Grip Invest Admin</h1>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Yield</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.length > 0 
                  ? (products.reduce((sum, p) => sum + p.annualYield, 0) / products.length).toFixed(1)
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.filter(p => p.riskLevel === 'low').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Yield</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.filter(p => p.annualYield > 10).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Investment Products</CardTitle>
                <CardDescription>Manage your investment product catalog</CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                    <DialogDescription>
                      Add a new investment product to your catalog
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={createForm.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ ...createForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Investment Type</Label>
                        <Select
                          value={createForm.investmentType}
                          onValueChange={(value: any) => setCreateForm({ ...createForm, investmentType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bond">Bond</SelectItem>
                            <SelectItem value="fd">Fixed Deposit</SelectItem>
                            <SelectItem value="mf">Mutual Fund</SelectItem>
                            <SelectItem value="etf">ETF</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="tenure">Tenure (Months)</Label>
                        <Input
                          id="tenure"
                          type="number"
                          value={createForm.tenureMonths}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ ...createForm, tenureMonths: Number(e.target.value) })}
                          required
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="yield">Annual Yield (%)</Label>
                        <Input
                          id="yield"
                          type="number"
                          step="0.1"
                          value={createForm.annualYield}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ ...createForm, annualYield: Number(e.target.value) })}
                          required
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="risk">Risk Level</Label>
                        <Select
                          value={createForm.riskLevel}
                          onValueChange={(value: any) => setCreateForm({ ...createForm, riskLevel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minInvestment">Min Investment (₹)</Label>
                        <Input
                          id="minInvestment"
                          type="number"
                          value={createForm.minInvestment}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ ...createForm, minInvestment: Number(e.target.value) })}
                          required
                          min="1000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxInvestment">Max Investment (₹)</Label>
                        <Input
                          id="maxInvestment"
                          type="number"
                          value={createForm.maxInvestment || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm({ 
                            ...createForm, 
                            maxInvestment: e.target.value ? Number(e.target.value) : undefined 
                          })}
                          min="1000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={createForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm({ ...createForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? 'Creating...' : 'Create Product'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {products.length > 0 ? (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge className={getTypeColor(product.investmentType)}>
                          {product.investmentType.toUpperCase()}
                        </Badge>
                        <Badge className={getRiskColor(product.riskLevel)}>
                          {product.riskLevel} Risk
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {product.annualYield}% yield
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {product.tenureMonths} months
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ₹{product.minInvestment.toLocaleString()} min
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{product.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground">Create your first investment product to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
