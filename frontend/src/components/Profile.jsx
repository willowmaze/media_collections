import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collectionApi, authApi, pictureBaseUrl } from '../api';
import { useAuth } from './AuthContext';
import { useScroll } from './useScroll';
import { Unauthorized, LoadingScreen } from './Errors';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

const Profile = () => {
    const { user, logout, setUser } = useAuth();
    const [editData, setEditData] = useState({ username: '', email: '', avatar_url: ''});
    const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || null);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const [shouldDeleteAvatar, setShouldDeleteAvatar] = useState(false);

    const [collections, setCollections] = useState([]);
    const [membershipCollections, setMembershipCollections] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const myCollectionsScroll = useScroll();

    const FilmIcon = () => <span className="inline-block w-3 h-2.5 border-y border-x-2 border-current relative before:absolute before:w-[1px] before:h-full before:bg-current before:left-1/3 after:absolute after:w-[1px] after:h-full after:bg-current after:right-1/3 mr-1.5" />;
    const LockIcon = () => <span className="inline-block w-2 h-2 border border-current rounded-t-full relative before:absolute before:w-2.5 before:h-1.5 before:bg-current before:top-1.5 before:-left-[1px] before:rounded-sm mr-1" />;
    const GlobeIcon = () => <span className="inline-block w-2.5 h-2.5 border border-current rounded-full relative before:absolute before:w-2.5 before:h-[1px] before:bg-current before:top-1/2 before:left-0 mr-1" />;
    const GearIcon = () => <span className="block w-3.5 h-3.5 border-2 border-current rounded-full relative before:absolute before:w-1 before:h-1 before:border-2 before:border-current before:rounded-full before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 mr-2"/>;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const [userRes, collRes, membershipCollRes] = await Promise.all([
                authApi.getUserById(user.id),
                authApi.getUserCollections(user.id),
                authApi.getUserMemberCollections(user.id)
            ]);
            setEditData({ username: userRes.data.username, email: userRes.data.email, avatar_url: userRes.data.avatar_url });
            if (userRes.data.avatar_url) {
                setPreviewUrl(userRes.data.avatar_url);
            }
            setUser(userRes.data);
            setCollections(collRes.data);
            setMembershipCollections(membershipCollRes.data);
        } catch (error) {
            console.error("Ошибка загрузки профиля", error);
        } finally {
            setLoading(false);
        }
    };

    const getAvatarSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('blob:')) return url;
        if (url.startsWith('http')) return url;
        return `${pictureBaseUrl}${url}`;
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let updatedUser = user;
            if (editData.username !== user.username || editData.email !== user.email) {
                const textResponse = await authApi.updateUser(user.id, {
                    username: editData.username,
                    email: editData.email
                });
                updatedUser = textResponse.data;
            }
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const avatarResponse = await authApi.uploadAvatar(user.id, formData);
                updatedUser = avatarResponse.data;
            }
            else if (shouldDeleteAvatar && user.avatar_url) {
                const deleteResponse = await authApi.deleteAvatar(user.id);
                updatedUser = deleteResponse.data;
                window.location.reload();
            }
            setUser(updatedUser);
            setEditData({
                username: updatedUser.username,
                email: updatedUser.email,
                avatar_url: updatedUser.avatar_url
            });
            setPreviewUrl(updatedUser.avatar_url);
            setSelectedFile(null);
            setShouldDeleteAvatar(false);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Ошибка при сохранении:", error.response?.data || error.message);
            alert("Ошибка: " + (error.response?.data?.detail || "Не удалось сохранить данные"));
        }
    };

    const removeAvatar = () => {
        setPreviewUrl(null);
        setSelectedFile(null);
        setShouldDeleteAvatar(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setShouldDeleteAvatar(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Вы уверены, что хотите удалить аккаунт? Это действие необратимо.")) {
            try {
                await authApi.deleteUser(user.id);
                window.location.href = '/login';
            } catch (error) {
                console.error("Ошибка при удалении", error);
            }
        }
    };

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

    if (loading) return <LoadingScreen></LoadingScreen>;
    if (!user) return <Unauthorized></Unauthorized>;

    return (
        <div>
            <header className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-6 items-center justify-between p-6 md:p-8 border-b border-border bg-background text-foreground select-none">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full sm:w-auto">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0 shadow-sm">
                    {previewUrl ? (
                        <img
                            src={getAvatarSrc(previewUrl)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl md:text-3xl font-bold text-muted-foreground/80 tracking-tight">
                            {user.username ? user.username[0].toUpperCase() : "A"}
                        </span>
                    )}
                </div>
                <div className="space-y-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground truncate">
                        {user.username ? user.username : "Аноним"}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground font-mono truncate">
                        {user.email}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end shrink-0 pt-2 sm:pt-0">
                <Button
                    variant="outline"
                    className="h-10 text-sm font-medium px-4"
                    onClick={() => setIsModalOpen(true)}
                >
                    <GearIcon /> Настройки
                </Button>
            </div>
            </header>

            <section className="space-y-6 select-none max-w-6xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between w-full pb-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Мои коллекции
                    </h2>
                    {collections.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg h-9 text-xs font-semibold px-5"
                            onClick={confirmCreation}
                        >
                            <span className="text-sm mr-1 font-light">+</span> Создать
                        </Button>
                    )}
                </div>

                {collections.length > 0 ? (
                    <div
                        className="flex items-center w-full gap-6 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory touch-pan-x"
                        ref={myCollectionsScroll.ref}
                        {...myCollectionsScroll.events}
                    >
                        {collections.map(list => (
                            <Card
                                key={list.id}
                                className="min-w-[280px] max-w-[280px] snap-start flex flex-col justify-between border border-border bg-card overflow-hidden transition-colors hover:bg-card/60 pointer-events-none sm:pointer-events-auto"
                            >
                                <div className="h-60 w-full bg-muted border-b border-border flex items-center justify-center text-muted-foreground/40 overflow-hidden">
                                    {list.cover_image ? (
                                        <img
                                            src={getAvatarSrc(list.cover_image)}
                                            alt="Preview"
                                            draggable="false"
                                            className="w-full h-full object-cover pointer-events-none select-none"
                                        />
                                    ) : (
                                        <div className="h-40 w-full bg-muted flex items-center justify-center text-muted-foreground text-xs"></div>
                                    )}
                                </div>

                                <CardHeader className="p-4 flex-grow">
                                    <CardTitle className="text-base font-semibold tracking-tight text-foreground line-clamp-2">
                                        <Link to={`/collections/${list.id}`} className="hover:underline block pointer-events-auto">
                                            {list.title}
                                        </Link>
                                    </CardTitle>
                                </CardHeader>

                                <CardFooter className="px-4 pb-4 pt-0 text-sm text-muted-foreground flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center" title="Лайки">
                                            <span className="text-muted-foreground/80 mr-1 text-xs">♡</span>
                                            <span className="text-xs">{list.likes || 0}</span>
                                        </div>
                                        <div className="flex items-center text-muted-foreground/70 gap-1" title="Медиафайлы">
                                            <FilmIcon className="w-3.5 h-3.5" />
                                            <span className="text-xs">{list.item_associations?.length || 0}</span>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium tracking-tight rounded-md pointer-events-auto select-none">
                                        {list.is_public ? (
                                            <div className="flex items-center gap-1" title="Публичная"><GlobeIcon className="w-3 h-3" /> Публичная</div>
                                        ) : (
                                            <div className="flex items-center gap-1" title="Приватная"><LockIcon className="w-3 h-3" /> Приватная</div>
                                        )}
                                    </Badge>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-border rounded-xl bg-muted/10 space-y-4 max-w-md mx-auto animate-in fade-in duration-300">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border text-lg">
                            📂
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">Коллекций пока нет</p>
                            <p className="text-xs text-muted-foreground leading-normal max-w-[280px]">
                                Создайте свой первый список, чтобы наполнить его фильмами, сериалами и аниме.
                            </p>
                        </div>
                        <Button size="sm" className="h-9 px-4 font-medium rounded-lg" onClick={confirmCreation}>
                            Создать свой первый список
                        </Button>
                    </div>
                )}
            </section>

            {membershipCollections.length > 0 && (
                <section className="space-y-6 select-none max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between w-full pb-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                            Коллекции в соавторстве
                        </h2>
                    </div>
                    <div
                        className="flex items-center w-full gap-6 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory touch-pan-x"
                        ref={myCollectionsScroll.ref}
                        {...myCollectionsScroll.events}
                    >
                        {membershipCollections.map(list => (
                            <Card
                                key={list.id}
                                className="min-w-[280px] max-w-[280px] snap-start flex flex-col justify-between border border-border bg-card overflow-hidden transition-colors hover:bg-card/60 pointer-events-none sm:pointer-events-auto"
                            >
                                <div className="h-60 w-full bg-muted border-b border-border flex items-center justify-center text-muted-foreground/40 overflow-hidden">
                                    {list.cover_image ? (
                                        <img
                                            src={getAvatarSrc(list.cover_image)}
                                            alt="Preview"
                                            draggable="false"
                                            className="w-full h-full object-cover pointer-events-none select-none"
                                        />
                                    ) : (
                                        <div className="h-40 w-full bg-muted flex items-center justify-center text-muted-foreground text-xs"></div>
                                    )}
                                </div>

                                <CardHeader className="p-4 flex-grow">
                                    <CardTitle className="text-base font-semibold tracking-tight text-foreground line-clamp-2">
                                        <Link to={`/collections/${list.id}`} className="hover:underline block pointer-events-auto">
                                            {list.title}
                                        </Link>
                                    </CardTitle>
                                </CardHeader>

                                <CardFooter className="px-4 pb-4 pt-0 text-sm text-muted-foreground flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center" title="Лайки">
                                            <span className="text-muted-foreground/80 mr-1 text-xs">♡</span>
                                            <span className="text-xs">{list.likes || 0}</span>
                                        </div>
                                        <div className="flex items-center text-muted-foreground/70 gap-1" title="Медиафайлы">
                                            <FilmIcon className="w-3.5 h-3.5" />
                                            <span className="text-xs">{list.item_associations?.length || 0}</span>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium tracking-tight rounded-md pointer-events-auto select-none">
                                        {list.is_public ? (
                                            <div className="flex items-center gap-1" title="Публичная"><GlobeIcon className="w-3 h-3" /> Публичная</div>
                                        ) : (
                                            <div className="flex items-center gap-1" title="Приватная"><LockIcon className="w-3 h-3" /> Приватная</div>
                                        )}
                                    </Badge>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {isModalOpen && (
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[420px] p-6 gap-6 border border-border bg-background shadow-lg select-none">
                    <DialogHeader className="space-y-1.5 text-left">
                        <DialogTitle className="text-xl font-bold tracking-tight">
                            Редактировать профиль
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div className="flex flex-col items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/40">
                            <div className="w-full h-40 sm:h-64 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0 shadow-inner">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl.startsWith('blob') ? previewUrl : `http://localhost:8000${previewUrl}`}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-muted-foreground/80">
                                        {user?.username ? user.username[0].toUpperCase() : "A"}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto h-9 text-xs font-semibold px-4 rounded-lg"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    Изменить фото
                                </Button>
                                {previewUrl && (
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="w-full sm:w-auto h-9 text-xs text-muted-foreground/60 hover:text-destructive px-2 transition-colors"
                                        onClick={removeAvatar}
                                    >
                                        Удалить
                                    </Button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-username" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Имя пользователя
                            </Label>
                            <Input
                                id="edit-username"
                                type="text"
                                className="w-full h-10"
                                placeholder="Введите имя"
                                value={editData.username}
                                onChange={(e) => setEditData({...editData, username: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Email адрес
                            </Label>
                            <Input
                                id="edit-email"
                                type="email"
                                className="w-full h-10 font-mono text-sm"
                                placeholder="name@example.com"
                                value={editData.email}
                                onChange={(e) => setEditData({...editData, email: e.target.value})}
                            />
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border/40 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 w-full sm:flex-1 text-sm font-medium order-2 sm:order-1"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                className="h-10 w-full sm:flex-1 text-sm font-medium order-1 sm:order-2"
                            >
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </form>
                    <Button
                        variant="ghost"
                        className="h-10 text-sm font-medium px-4 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={handleDeleteAccount}
                    >
                        Удалить аккаунт
                    </Button>
                </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default Profile;