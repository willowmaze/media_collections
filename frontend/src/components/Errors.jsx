import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export const Forbidden = () => {
    const navigate = useNavigate();
    return (
        <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-6 bg-background text-foreground text-center">
            <div className="max-w-md space-y-6">
                <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-muted-foreground/40 select-none">
                    403
                </h1>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Доступ ограничен</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        У вас недостаточно прав для просмотра этой страницы. Вернитесь на главную или попробуйте авторизоваться под другим аккаунтом.
                    </p>
                </div>
                <div className="pt-2">
                    <Button onClick={() => navigate('/')} size="lg" className="h-11 px-6 font-medium">
                        Вернуться на главную
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const Unauthorized = () => {
    const navigate = useNavigate();
    const location = useLocation();


    const handleLogin = () => {
        navigate('/login', { state: { from: location.pathname } });
    };

    const handleRegister = () => {
        navigate('/register', { state: { from: location.pathname } });
    };

    return (
        <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-6 bg-background text-foreground text-center">
            <div className="max-w-md space-y-6">
                <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-muted-foreground/40 select-none">
                    401
                </h1>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Требуется авторизация</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Чтобы просматривать этот контент, вам необходимо войти в свой аккаунт или создать новый профиль.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button onClick={handleLogin} size="lg" className="w-full sm:w-auto h-11 px-6 font-medium">
                        Войти в аккаунт
                    </Button>
                    <Button onClick={handleRegister} size="lg" variant="outline" className="w-full sm:w-auto h-11 px-6 font-medium">
                        Регистрация
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const NotFound = () => (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-6 bg-background text-foreground text-center">
            <div className="max-w-md space-y-6">
                <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-muted-foreground/40 select-none">
                    404
                </h1>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Страница не найдена</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Похоже, вы зашли в тупик. Страница, которую вы ищете, не существует, была удалена или перемещена.
                    </p>
                </div>
                <div className="pt-2">
                    <Button asChild size="lg" className="h-11 px-6 font-medium">
                        <Link to="/">Вернуться на главную</Link>
                    </Button>
                </div>
            </div>
        </div>
);

export const LoadingScreen = () => (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-6 bg-background text-foreground text-center text-xl">
        Загрузка...
    </div>
);