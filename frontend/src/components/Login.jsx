import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/";

    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (error) {
            const message = error.response?.data?.detail || 'Ошибка входа';
            alert(typeof message === 'object' ? JSON.stringify(message) : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6 bg-background text-foreground">
            <Card
                className="w-full sm:w-[420px] bg-card rounded-xl"
                style={{ border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}
            >
                <CardHeader className="space-y-2 text-center pt-8 pb-4 px-8">
                    <CardTitle className="text-2xl font-bold tracking-tight">Войти в аккаунт</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-6">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                                Email *
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="example@gmail.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 px-3.5"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                                Пароль *
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-11 px-3.5"
                            />
                        </div>
                        <Button type="submit" className="w-full h-11 text-sm font-medium mt-2" disabled={loading}>
                            {loading ? 'Вход...' : 'Войти'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex items-center justify-center px-8 pb-8 pt-2">
                    <div className="flex items-center gap-x-1.5 text-sm text-muted-foreground">
                        <span>Нет аккаунта?</span>
                        <Link to="/register" className="font-medium text-primary hover:underline transition-all">
                            Создать профиль
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;