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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface TransactionLog {
  id: number;
  userId?: string;
  email?: string;
  endpoint: string;
  httpMethod: string;
  statusCode: number;
  errorMessage?: string;
  createdAt: string;
}

interface ErrorSummary {
  endpoint: string;
  statusCode: number;
  count: number;
  lastOccurrence: string;
  errorMessage?: string;
}

export default function LogsPage() {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [filteredLogs, setFilteredLogs] = useState<TransactionLog[]>([]);

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, statusFilter, methodFilter]);

  const fetchLogs = async () => {
    try {
      const data = await apiClient.getLogs() as {
        logs: TransactionLog[];
        errorSummary: ErrorSummary[];
        aiInsights: string[];
      };
      setLogs(data.logs);
      setErrorSummary(data.errorSummary);
      setAiInsights(data.aiInsights);
    } catch (error) {
      toast.error('Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        filtered = filtered.filter(log => log.statusCode >= 200 && log.statusCode < 300);
      } else if (statusFilter === 'error') {
        filtered = filtered.filter(log => log.statusCode >= 400);
      }
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(log => log.httpMethod === methodFilter);
    }

    setFilteredLogs(filtered);
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-green-100 text-green-800';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusCode >= 500) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (statusCode >= 400) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <CardDescription>Please log in to view transaction logs</CardDescription>
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
          <h1 className="text-3xl font-bold mb-2">Transaction Logs</h1>
          <p className="text-gray-600">
            Monitor and analyze your API activity and system performance
          </p>
        </div>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>AI Error Analysis</span>
              </CardTitle>
              <CardDescription>
                Intelligent insights about your transaction patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aiInsights.map((insight, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{insight}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="logs">Transaction Logs</TabsTrigger>
            <TabsTrigger value="errors">Error Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters & Search</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success (2xx)</SelectItem>
                      <SelectItem value="error">Error (4xx/5xx)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="HTTP Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={fetchLogs} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Logs</CardTitle>
                <CardDescription>
                  {filteredLogs.length} of {logs.length} transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredLogs.length > 0 ? (
                  <div className="space-y-2">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(log.statusCode)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getMethodColor(log.httpMethod)}>
                                {log.httpMethod}
                              </Badge>
                              <Badge className={getStatusColor(log.statusCode)}>
                                {log.statusCode}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">{log.endpoint}</p>
                            {log.errorMessage && (
                              <p className="text-sm text-red-600 mt-1">{log.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDate(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Summary</CardTitle>
                <CardDescription>
                  Analysis of errors and issues in your transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errorSummary.length > 0 ? (
                  <div className="space-y-4">
                    {errorSummary.map((error, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getMethodColor('GET')}>
                              {error.endpoint.split(' ')[0] || 'GET'}
                            </Badge>
                            <Badge className={getStatusColor(error.statusCode)}>
                              {error.statusCode}
                            </Badge>
                            <span className="font-medium">{error.endpoint}</span>
                          </div>
                          <Badge variant="destructive">
                            {error.count} occurrences
                          </Badge>
                        </div>
                        {error.errorMessage && (
                          <p className="text-sm text-red-600 mb-2">{error.errorMessage}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Last occurred: {formatDate(error.lastOccurrence)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No errors found</h3>
                    <p className="text-muted-foreground">
                      Your transactions are running smoothly!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
