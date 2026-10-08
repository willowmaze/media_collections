import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


const Register = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.register(
                formData.email,
                formData.password,
                formData.username
            );
            navigate('/login');
        } catch (error) {
            console.error("Ошибка регистрации", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6 bg-background text-foreground">
            <Card
                className="w-full sm:w-[420px] bg-popover/50 rounded-xl"
                style={{ border: 'none', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }}
            >
                <CardHeader className="space-y-2 text-center pt-8 pb-4 px-8">
                    <CardTitle className="text-2xl font-bold tracking-tight">Регистрация</CardTitle>
                </CardHeader>

                <CardContent className="px-8 pb-6">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                                Email *
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@gmail.com"
                                required
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full h-11 px-3.5"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="username" className="text-sm font-medium text-foreground/80">
                                Имя пользователя
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Имя пользователя"
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                                Пароль *
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Минимум 8 символов"
                                required
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full h-11 px-3.5"
                            />
                        </div>

                        <Button type="submit" className="w-full h-11 text-sm font-medium mt-2" disabled={loading}>
                            {loading ? 'Создание...' : 'Зарегистрироваться'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex items-center justify-center px-8 pb-8 pt-2">
                    <div className="flex items-center gap-x-1.5 text-sm text-muted-foreground">
                        <Link to="/login">Уже есть аккаунт? Войти</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
