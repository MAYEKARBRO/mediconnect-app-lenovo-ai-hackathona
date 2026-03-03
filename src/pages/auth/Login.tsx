import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { UserRole } from '../../types';
import { Activity, Stethoscope, User, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const { signIn, signUp, user } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<UserRole>('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate(`/${user.role}`);
        }
    }, [user, navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password, role, fullName);
                if (!user) {
                    setError('Check your email for confirmation link!');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    {import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL' && (
                        <div className="mb-4 rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
                            <strong>Demo Mode Enabled</strong><br />
                            Supabase keys missing. Login runs locally.<br />
                            To use backend, update .env file.
                        </div>
                    )}
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Activity className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        MediConnect
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-center space-x-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setRole('patient')}
                                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${role === 'patient' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <User className="h-6 w-6 mb-1" />
                                <span className="text-xs font-medium">Patient</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('doctor')}
                                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${role === 'doctor' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <Stethoscope className="h-6 w-6 mb-1" />
                                <span className="text-xs font-medium">Doctor</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${role === 'admin' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <ShieldCheck className="h-6 w-6 mb-1" />
                                <span className="text-xs font-medium">Admin</span>
                            </button>
                        </div>
                        <CardTitle className="text-center">
                            {isLogin ? `Log in as ${role}` : `Sign up as ${role}`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAuth} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required={!isLogin}
                                        className="mt-1"
                                    />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm text-center">{error}</div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                variant={role === 'doctor' ? 'secondary' : role === 'admin' ? 'primary' : 'primary'}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Sign up')}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm">
                            <span className="text-gray-500">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                {isLogin ? 'Sign up' : 'Log in'}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
