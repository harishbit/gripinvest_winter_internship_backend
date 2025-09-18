'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit, 
  Save, 
  X,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your profile</CardDescription>
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

  const handleSave = async () => {
    if (!editedUser || !user) return;
    
    setIsLoading(true);
    try {
      const result = await apiClient.updateProfile({
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
      });

      // Update the user in context
      updateUser(result.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      setEditedUser(user); // Reset to original values on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <img src="/favicon.ico" alt="Grip Invest" className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Grip Invest</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{user.firstName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    <span>View Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center space-x-2 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription className="flex items-center justify-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </CardDescription>
              <div className="flex justify-center mt-4">
                <Badge className={getRiskColor(user.riskAppetite)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.riskAppetite.charAt(0).toUpperCase() + user.riskAppetite.slice(1)} Risk
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your account details and preferences
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} size="sm" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={editedUser?.firstName || ''}
                      onChange={(e) => setEditedUser({...editedUser!, firstName: e.target.value})}
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="text-sm font-medium">{user.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={editedUser?.lastName || ''}
                      onChange={(e) => setEditedUser({...editedUser!, lastName: e.target.value})}
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="text-sm font-medium">{user.lastName || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Risk Appetite</Label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge className={getRiskColor(user.riskAppetite)}>
                    {user.riskAppetite.charAt(0).toUpperCase() + user.riskAppetite.slice(1)} Risk
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your risk preference affects investment recommendations.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Account Created</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              {user.updatedAt && user.updatedAt !== user.createdAt && (
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={() => toast.error('Feature not implemented yet')}
                className="w-full"
              >
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}