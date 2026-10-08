import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collectionApi } from '../api';
import { useAuth } from './AuthContext';
import { useScroll } from './useScroll';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const Home = () => {
    const lists = [
        { id: 1, title: "Топ хорроров 2025", likes: 120 },
        { id: 2, title: "Ламповое аниме", likes: 450 },
        { id: 3, title: "Классика HBO", likes: 89 },
        { id: 4, title: "Сериалы на выходные", likes: 230 },
        { id: 5, title: "Киберпанк подборка", likes: 600 },
    ];

    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const collectionsScroll = useScroll();
    const { user } = useAuth();

    const confirmCreation = async () => {
        setLoading(true);
        try {
            const response = await collectionApi.createCollection({
                title: "Коллекция",
                is_public: false,
                description: "",
                media_items_id: [],
                user_id: user.id
            });

            const newCollectionId = response.data.id;
            setIsModalOpen(false);
            navigate(`/collections/${newCollectionId}`);
        } catch (error) {
            console.error("Ошибка при создании коллекции:", error);
            alert("Не удалось создать коллекцию. Попробуйте позже.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-12 bg-background text-foreground">
            <section className="text-center md:text-left py-12 border-b border-border space-y-6">
                <div className="max-w-2xl space-y-3">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        Что посмотреть этим вечером?
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Создавайте совместные коллекции и голосуйте за интересное, исследуйте популярные подборки и делитесь своими.
                    </p>
                </div>

                <Button size="lg" onClick={() => setIsModalOpen(true)} disabled={loading}>
                    <span className="mr-2 text-xl font-light">+</span> Создать коллекцию
                </Button>
            </section>

            <section className="space-y-6 select-none">
                <h2 className="text-2xl font-bold tracking-tight">Популярные коллекции</h2>
                <div
                    className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    ref={collectionsScroll.ref}
                    {...collectionsScroll.events}
                >
                    {lists.map(list => (
                        <Card
                            key={list.id}
                            className="min-w-[280px] max-w-[280px] snap-start flex flex-col justify-between transition-colors hover:bg-card/60 pointer-events-none sm:pointer-events-auto"
                        >
                            <div className="h-60 w-full bg-muted border-b border-border flex items-center justify-center text-muted-foreground text-xs">
                            </div>

                            <CardHeader className="p-4">
                                <CardTitle className="text-base font-semibold tracking-tight line-clamp-2">
                                    {list.title}
                                </CardTitle>
                            </CardHeader>

                            <CardFooter className="px-4 pb-4 pt-0 text-sm text-muted-foreground flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <span className="text-xs">♡</span> {list.likes}
                                </div>
                                <span className="text-xs font-medium text-primary hover:underline cursor-pointer pointer-events-auto">
                                    Открыть →
                                </span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] backdrop:bg-black/50 shadow-xl">
                    {user ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Создать новую коллекцию?</DialogTitle>
                                <DialogDescription>
                                    Будет создан новый приватный список. Вы сможете изменить название и добавить фильмы позже.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Отмена
                                </Button>
                                <Button onClick={confirmCreation} disabled={loading}>
                                    Да, создать
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Требуется авторизация</DialogTitle>
                                <DialogDescription className="flex justify-end gap-3 pt-4">
                                    Войдите в аккаунт, чтобы создавать свои списки и делиться ими с друзьями.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                <Button variant="outline" asChild>
                                    <Link to="/register">Создать аккаунт</Link>
                                </Button>
                                <Button asChild>
                                    <Link to="/login">Войти</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Home;