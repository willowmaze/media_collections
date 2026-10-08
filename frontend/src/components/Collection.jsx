import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api, { collectionApi, authApi, pictureBaseUrl } from '../api';
import { useAuth } from './AuthContext';
import { Forbidden, LoadingScreen } from './Errors';
import AccessGuard from './AccessGuard';
import SearchBar  from './SearchBar';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const LockIcon = () => <span className="inline-block w-2.5 h-2.5 border border-current rounded-t-full relative before:absolute before:w-3 before:h-2 before:bg-current before:top-2 before:-left-[2px] before:rounded-sm mr-1.5 mb-0.5" />;
const GlobeIcon = () => <span className="inline-block w-3 h-3 border border-current rounded-full relative before:absolute before:w-3 before:h-[1px] before:bg-current before:top-1/2 before:left-0 after:absolute after:w-[1px] after:h-3 after:bg-current after:left-1/2 after:top-0 mr-1.5" />;
const PencilIcon = () => <span className="inline-block text-xs text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity ml-2">✎</span>;
const GearIcon = () => <span className="block w-4 h-4 border-2 border-current rounded-full relative before:absolute before:w-1.5 before:h-1.5 before:border-2 before:border-current before:rounded-full before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2" />;


const Collection = () => {
    const { id } = useParams();

    // для правильной последовательности аутентификации и загрузки коллекции функционал коллекций во внутреннем элементе
    return (
        <AccessGuard collectionId={id}>
            <CollectionContent id={id} />
        </AccessGuard>
    );
};


const CollectionContent = ({id}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();

    const [collection, setCollection] = useState(null);
    const [votes, setVotes] = useState(null);
    const [activeMedia, setActiveMedia] = useState(null);

    const [showSettings, setShowSettings] = useState(false);
    const [editMode, setEditMode] = useState({ field: null, value: '' });
    const cancelEdit = () => setEditMode({ field: null });

    const [showCoverEditModal, setShowCoverEditModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [tempCoverPreviewUrl, setTempCoverPreviewUrl] = useState(null);
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    const loadCollection = useCallback(async () => {
        try {
            const res = await collectionApi.getCollection(id);
            const userVotes = await collectionApi.getUserVotesInCollection(id);
            setCollection(res.data);
            setVotes(userVotes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadCollection();
    }, [id]);

    useEffect(() => {
        return () => {
            if (tempCoverPreviewUrl) {
                URL.revokeObjectURL(tempCoverPreviewUrl);
            }
        };
    }, [tempCoverPreviewUrl]);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (tempCoverPreviewUrl) {
                URL.revokeObjectURL(tempCoverPreviewUrl);
            }
            setSelectedFile(file);
            setTempCoverPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            if (tempCoverPreviewUrl) {
                URL.revokeObjectURL(tempCoverPreviewUrl);
            }
            setTempCoverPreviewUrl(null);
        }
    };

    const handleSaveCover = async () => {
        if (!selectedFile && !collection.cover_image) {
            handleCancelCoverEdit();
            return;
        }
        setIsUploadingCover(true);
        try {
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const coverResponse = await collectionApi.uploadCover(collection.id, formData);
                const updatedCollection = coverResponse.data;
                setCollection(updatedCollection);
                handleCancelCoverEdit();
            } else if (collection.cover_image && !selectedFile) {
                handleCancelCoverEdit();
                return;
            }
        } catch (error) {
            console.error('Ошибка сохранения обложки:', error);
        } finally {
            setIsUploadingCover(false);
        }
    };

    const handleRemoveCover = async () => {
        setIsUploadingCover(true);
        try {
            const deleteCoverResponse = await collectionApi.deleteCover(collection.id);
            const updatedCollection = deleteCoverResponse.data;

            setCollection(updatedCollection);
            handleCancelCoverEdit();
        } catch (error) {
            console.error('Ошибка удаления обложки:', error);
        } finally {
            setIsUploadingCover(false);
        }
    };

    const handleCancelCoverEdit = () => {
        setShowCoverEditModal(false);
        setSelectedFile(null);
        if (tempCoverPreviewUrl) {
            URL.revokeObjectURL(tempCoverPreviewUrl);
        }
        setTempCoverPreviewUrl(null);
    };

    const getCoverSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('blob:')) return url;
        if (url.startsWith('http')) return url;
        return `${pictureBaseUrl}${url}`;
    };

    const handleSaveField = async () => {
        try {
            await collectionApi.updateCollection(id, { [editMode.field]: editMode.value, user_id: user.id });
            setCollection({ ...collection, [editMode.field]: editMode.value });
            setEditMode({ field: null, value: '' });
        } catch (err) {
            console.error("Ошибка сохранения:", err);
        }
    };

    useEffect(() => {
        const wsUrl = `ws://localhost:8000/websocket/collection/${id}`;
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log("Пришло сообщение из сокета:", data);
          if (data.type === 'COLLECTION_UPDATED') {
            console.log("Данные обновлены пользователем:", data.actor);
            loadCollection();
          }
        };
        socket.onopen = () => {
            console.log("Connected");
        };
        socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        return () => {
          if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
          }
        };
      }, [id, loadCollection]);


    if (loading) return <LoadingScreen></LoadingScreen>;
    if (!collection) return <Forbidden></Forbidden>;

    return (
        <Card className="bg-popover/85">
            <div className="p-6 md:p-8 border-b border-border text-foreground">
            <div className="flex flex-col sm:flex-row gap-6 items-start justify-between w-full">
                <div className="relative group w-64 h-64 md:w-70 md:h-70 shrink-0 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                    {collection.cover_image ? (
                        <img
                            src={getCoverSrc(collection.cover_image)}
                            alt="Collection Cover"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-40 w-full bg-muted border-b border-border flex items-center justify-center text-muted-foreground text-xs"></div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs font-medium rounded-lg"
                            onClick={() => setShowCoverEditModal(true)}
                        >
                            Изменить
                        </Button>
                    </div>
                </div>
                <div className="flex-grow space-y-4 min-w-0 w-full sm:pt-1">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-popover/10 text-accent font-medium select-none">
                                {collection.is_public ? (
                                    <><GlobeIcon /> Публичная </>
                                ) : (
                                    <><LockIcon /> Приватная </>
                                )}
                            коллекция
                            </Badge>
                        </div>
                        {editMode.field === 'title' ? (
                            <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                                <Input
                                    autoFocus
                                    maxLength={100}
                                    value={editMode.value}
                                    onChange={(e) => setEditMode({...editMode, value: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveField()}
                                    className="h-10 text-lg font-bold"
                                />
                                <div className="flex gap-1.5 shrink-0">
                                    <Button size="sm" onClick={handleSaveField} className="rounded-lg">Сохранить</Button>
                                    <Button size="sm" variant="outline" onClick={cancelEdit} className="rounded-lg">Отмена</Button>
                                </div>
                            </div>
                        ) : (
                            <h1
                                className="text-2xl md:text-3xl font-extrabold tracking-tight cursor-pointer group flex items-center max-w-xl truncate"
                                onClick={() => setEditMode({field: 'title', value: collection.title})}
                            >
                                {collection.title || "Коллекция"}
                                <PencilIcon />
                            </h1>
                        )}
                    </div>
                    <div className="max-w-2xl">
                        {editMode.field === 'description' ? (
                            <div className="space-y-2">
                                <Textarea
                                    autoFocus
                                    maxLength={250}
                                    value={editMode.value}
                                    onChange={(e) => setEditMode({...editMode, value: e.target.value})}
                                    className="min-h-[80px] resize-none text-sm text-muted-foreground"
                                />
                                <div className="flex justify-end gap-1.5">
                                    <Button size="sm" variant="outline" onClick={cancelEdit} className="rounded-lg">Отмена</Button>
                                    <Button size="sm" onClick={handleSaveField} className="rounded-lg">Готово</Button>
                                </div>
                            </div>
                        ) : (
                            <p
                                className="text-sm md:text-base text-muted-foreground leading-relaxed cursor-pointer group flex items-start break-words"
                                onClick={() => setEditMode({field: 'description', value: collection.description})}
                            >
                                <span className="flex-grow">
                                    {collection.description || "Добавьте описание для вашей коллекции..."}
                                </span>
                                <PencilIcon />
                            </p>
                        )}
                    </div>
                </div>
                <div className="shrink-0 self-start sm:pt-1">
                    {collection.user_id === user.id && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 border-2 border-border text-muted-foreground hover:text-foreground hover:bg-accent/70 rounded-md"
                            onClick={() => setShowSettings(true)}
                            title="Настройки коллекции"
                        >
                            <GearIcon />
                        </Button>
                    )}
                </div>
            </div>
            <Dialog open={showCoverEditModal} onOpenChange={handleCancelCoverEdit}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {collection.cover_image ? "Изменить обложку" : "Добавить обложку"}
                        </DialogTitle>
                        <DialogDescription>
                            Загрузите изображение для обложки вашей коллекции.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="w-36 h-36 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shadow-inner">
                            {tempCoverPreviewUrl ? (
                                <img src={getCoverSrc(tempCoverPreviewUrl)} alt="Предпросмотр" className="w-full h-full object-cover" />
                            ) : collection.cover_image ? (
                                <img src={getCoverSrc(collection.cover_image)} alt="Текущая обложка" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-muted-foreground font-medium">Нет обложки</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            id="cover-upload-input"
                            className="hidden"
                        />
                        <Button asChild variant="outline" className="w-full h-10 cursor-pointer">
                            <label htmlFor="cover-upload-input">
                                {selectedFile ? `Выбрано: ${selectedFile.name}` : "Выбрать файл"}
                            </label>
                        </Button>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border mt-4">
                        {collection.cover_image && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveCover}
                                disabled={isUploadingCover}
                                className="sm:mr-auto rounded-lg"
                            >
                                Удалить обложку
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleCancelCoverEdit}
                            disabled={isUploadingCover}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleSaveCover}
                            disabled={isUploadingCover || (!selectedFile && !collection.cover_image)}
                        >
                            {isUploadingCover ? 'Загрузка...' : 'Сохранить'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

            <SearchBar
                collectionId={collection.id}
                onAdded={loadCollection}

            />

            <>
            <CardContent className="p-6 md:p-8 pt-0 bg-background">
                <div className="flex items-center px-4 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
                    <span className="w-10 shrink-0 text-center">#</span>
                    <span className="flex-grow pl-2">Название</span>
                    <span className="w-48 shrink-0 text-center">Интерес</span>
                    <span className="w-20 shrink-0 text-right">Удалить</span>
                </div>
                <div className="divide-y divide-border">
                    {collection.item_associations && collection.item_associations.map((association, index) => {
                        const userVoteValue = votes ? (votes[association.id] || 0) : 0;
                        const item = {
                            ...association,
                            user_vote: userVoteValue
                        };
                        return (
                            <MediaRow
                                key={item.id}
                                item={item}
                                index={index + 1}
                                collectionId={id}
                                onInfoClick={() => setActiveMedia(item)}
                                onUpdate={loadCollection}
                            />
                        );
                    })}
                </div>
            </CardContent>
            <Sheet open={!!activeMedia} onOpenChange={(open) => !open && setActiveMedia(null)}>
                <SheetContent side="right" className="w-full sm:max-w-md border-l border-border bg-card p-6 flex flex-col justify-between">
                    <div className="space-y-6 overflow-y-auto pr-1">
                        <div className="w-full aspect-[2/3] rounded-lg overflow-hidden border border-border bg-muted shadow-sm">
                            {activeMedia && (
                                <img
                                    src={`https://simkl.in/posters/${activeMedia.poster}_ca.jpg`}
                                    alt="poster"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <div className="space-y-4">
                            <SheetHeader className="text-left space-y-1">
                                <SheetTitle className="text-xl font-bold tracking-tight leading-tight">
                                    {activeMedia?.title_en}
                                </SheetTitle>
                                <SheetDescription className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80">
                                    Детали
                                </SheetDescription>
                            </SheetHeader>
                            <div className="border-t border-border pt-4">
                                <div className="flex justify-between py-2 text-sm border-b border-border/40">
                                    <span className="text-muted-foreground">Год выпуска</span>
                                    <span className="font-medium text-foreground">{activeMedia?.year}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-[425px] p-0 border-none bg-transparent shadow-none">
                    {showSettings && (
                        <SettingsModal
                            collection={collection}
                            onClose={() => setShowSettings(false)}
                            onUpdate={loadCollection}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
        </Card>
    );
};


const MediaRow = ({ item, index, collectionId, onInfoClick, onUpdate }) => {
    const [userRating, setUserRating] = useState(item.user_vote || 0);
    const [isRated, setIsRated] = useState(!!item.user_vote);
    const [hoverRating, setHoverRating] = useState(0);

    const CloseIcon = () => <span className="block w-3 h-3 relative before:absolute before:w-full before:h-[1.5px] before:bg-current before:top-1/2 before:left-0 before:-translate-y-1/2 before:rotate-45 after:absolute after:w-full after:h-[1.5px] after:bg-current after:top-1/2 after:left-0 after:-translate-y-1/2 after:-rotate-45" />;
    const InfoIcon = () => <span className="inline-flex items-center justify-center w-4 h-4 border border-current rounded-full text-[10px] font-serif font-bold italic mb-0.5">i</span>;

    const handleRate = async (val) => {
        try {
            const data = await collectionApi.rateMediaItem(collectionId, item.id, val);
            setUserRating(data.user_rate);
            setIsRated(true);
        } catch (err) {
            console.error("Ошибка при оценке:", err);
        }
    };

    const confirmDeleteItem = async (item) => {
        try {
            await collectionApi.deleteMediaItem(item.id, collectionId);
            onUpdate();
        } catch (err) {
            console.error("Ошибка при удалении:", err);
        }
    };

    return (
        <div className={`flex items-center px-4 py-3.5 hover:bg-muted/40 transition-colors group ${
                            Number(item.average_rating) >= 4.0
                                ? 'bg-accent/20 hover:bg-accent/15'
                                : 'bg-background/80'
                        }`}>
            <span className="w-10 shrink-0 text-center text-sm font-mono text-muted-foreground/70">
                {index}
            </span>
            <div className="flex-grow pl-2 flex items-center justify-between min-w-0 pr-4">
                <div className="flex flex-col space-y-0.5 min-w-0">
                    <span
                        className="text-sm font-semibold text-foreground truncate cursor-pointer hover:underline"
                        onClick={onInfoClick}
                    >
                        {item.title_en}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                        {item.year}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md border-0 border-border text-muted-foreground/60 hover:text-foreground hover:bg-background shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={onInfoClick}
                >
                    <InfoIcon />
                </Button>
            </div>

            <div className="w-48 shrink-0 flex flex-col items-center justify-center space-y-1">
                {item.average_rating !== undefined && item.average_rating !== null && (
                    <span
                        className={`text-[13px] font-mono tracking-wide transition-colors duration-200 select-none ${
                            Number(item.average_rating) >= 4.0
                                ? 'text-primary font-bold drop-shadow-[0_0_6px_rgba(var(--primary),0.2)]'
                                : 'text-muted-foreground/80 font-medium'
                        }`}
                        title={`Средний рейтинг: ${Number(item.average_rating).toFixed(1)}`}
                    >
                        Средняя оценка: {Number(item.average_rating).toFixed(1)}
                    </span>
                )}
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((step) => {
                        const isActive = (hoverRating || userRating) >= step;
                        const isHovered = hoverRating >= step;
                        return (
                            <button
                                key={step}
                                type="button"
                                className={`w-3.5 h-3.5 border transition-all rounded-[3px]
                                    ${isActive
                                        ? 'bg-primary border-primary'
                                        : 'bg-transparent border-muted-foreground/30 hover:border-muted-foreground/60'
                                    }
                                    ${isHovered ? 'scale-105 opacity-90' : ''}
                                `}
                                onMouseEnter={() => setHoverRating(step)}
                                onClick={() => handleRate(step)}
                                title={userRating > 0 ? `Ваша оценка: ${userRating}` : `Оценить на ${step}`}
                            />
                        );
                    })}
                </div>
            </div>
            <div className="w-20 shrink-0 text-right">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    onClick={() => confirmDeleteItem(item)}
                    title="Удалить из коллекции"
                >
                    <CloseIcon />
                </Button>
            </div>
        </div>
    );
};


const SettingsModal = ({ collection, onClose, onUpdate }) => {
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('general');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [members, setMembers] = useState([]);
    const [showMembers, setShowMembers] = useState(false);

    const [privacyValue, setPrivacyValue] = useState('private');
    const [hasExistingPassword] = useState(!!collection.has_password);

    const [isListOpen, setIsListOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const privacyListRef = useRef(null);

    const { user, logout } = useAuth();

    const privacyList = [
        {value: "private", label: "Приватный режим", description: "Доступно только вам и текущим участникам"},
        {value: "password", label: "По паролю", description: "Коллекция защищена паролем"},
        {value: "link", label: "По специальной ссылке", description: "Доступ откроется после перехода по ссылке"},
        {value: "link_and_password", label: "По специальной ссылке и паролю", description: "Доступ откроется после перехода по ссылке и ввода пароля"},
        ]

    const [privacySettings, setPrivacySettings] = useState({
        access_type: collection?.access_type || 'private',
        password: '',
        token: '',
        shouldResetToken: false,
        shouldRemoveMembers: false
    });

    useEffect(() => {
        if (collection) {
            setPrivacySettings(prev => ({
                ...prev,
                access_type: collection.access_type || 'private'
            }));
        }
    }, [collection]);

    const handleSavePrivacy = async () => {
        try {
            await collectionApi.updatePrivacy(collection.id, {
                access_type: privacySettings.access_type,
                password: privacySettings.password
            });

            if (onUpdate) {
                await onUpdate();
            }
            onClose()
        } catch (err) {
            console.error(err);
        }
    };

    const handleGetLink = async () => {
        try {
            const response = await collectionApi.getInviteToken(collection.id)
            const shareableUrl = `${ window.location.origin }/collections/${collection.id}/?invite_token=${response.data.invite_token}`;
            await navigator.clipboard.writeText(shareableUrl);
        } catch (err) {
            console.error("Ошибка при получении ссылки:", err);
        }
    };

    const handleResetLink = async () => {
        try {
            const res = await collectionApi.resetInviteToken(collection.id);
            setCollection(prev => ({ ...prev, invite_token: res.data.invite_token }));
        } catch (err) {
            console.error("Ошибка сброса:", err);
        }
    }

    useEffect(() => {
        const fetchMembers = async () => {
            if (activeTab !== 'membersSettings' || !collection?.id) return;

            try {
                const res = await collectionApi.getMembers(collection.id);
                setMembers(res.data);
                setShowMembers(true);
            } catch (err) {
                console.error("Ошибка загрузки участников", err);
            }
        };
        fetchMembers();
    }, [activeTab, collection?.id]);

    const removeUser = async (userId) => {
        await collectionApi.removeMember(collection.id, userId);
        setMembers(members.filter(p => p.id !== userId));
    };

    const handleRemoveUsers = async () => {
        try {
            await collectionApi.clearMembers(collection.id);

        } catch (err) {
            console.error(err);
        }
        if (onUpdate) {
                await onUpdate();
        }
        onClose()
    };

    const handleTogglePublic = async (e) => {
        setIsUpdating(true);
        try {
            await collectionApi.updateSettings(collection.id, { is_public: e.target.checked, user_id: user.id });
            onUpdate();
        } catch (error) {
            console.error("Ошибка обновления:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDelete = async () => {
        await collectionApi.deleteCollection(collection.id);
        window.location.href = '/profile';
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (privacyListRef.current && !privacyListRef.current.contains(event.target)) {
                setIsListOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentPrivacy = privacyList.find(p => p.value === privacySettings.access_type);

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden flex h-[550px] border border-border bg-background">
                <aside className="w-48 bg-muted/40 border-r border-border flex flex-col justify-between p-4 shrink-0 select-none">
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                            Настройки
                        </h3>
                        <nav className="flex flex-col gap-1">
                            <Button
                                variant={activeTab === 'general' ? 'secondary' : 'ghost'}
                                className={`w-full justify-start font-medium text-sm h-9 px-3 rounded-md transition-colors
                                    ${activeTab === 'general'
                                        ? 'bg-secondary/50 text-secondary-background font-semibold hover:bg-accent/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
                                    }`}
                                onClick={() => setActiveTab('general')}
                            >
                                Основное
                            </Button>
                            <Button
                                variant={activeTab === 'privacy' ? 'secondary' : 'ghost'}
                                className={`w-full justify-start font-medium text-sm h-9 px-3 rounded-md transition-colors
                                    ${activeTab === 'privacy'
                                        ? 'bg-secondary/50 text-secondary-background font-semibold hover:bg-accent/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
                                    }`}
                                onClick={() => setActiveTab('privacy')}
                            >
                                Доступ
                            </Button>
                            <Button
                                variant={activeTab === 'membersSettings' ? 'secondary' : 'ghost'}
                                className={`w-full justify-start font-medium text-sm h-9 px-3 rounded-md transition-colors
                                    ${activeTab === 'membersSettings'
                                        ? 'bg-secondary/50 text-secondary-background font-semibold hover:bg-accent/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
                                    }`}
                                onClick={() => setActiveTab('membersSettings')}
                            >
                                Соавторы
                            </Button>
                        </nav>
                    </div>
                </aside>

                <main className="flex-grow p-6 overflow-y-auto bg-background text-foreground">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Управление</h2>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted">
                                <div className="space-y-1 pr-4">
                                    <span className="text-sm font-semibold block">Публичный доступ</span>
                                    <span className="text-xs text-muted-foreground block leading-normal">
                                        Позволяет другим пользователям кроме соавторов видеть эту коллекцию.
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    id="public-access-toggle"
                                    disabled={isUpdating}
                                    onClick={() => handleTogglePublic({ target: { checked: !collection.is_public } })}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center p-0.5 rounded-full border border-border transition-colors duration-200 ease-in-out ${
                                        collection.is_public ? 'bg-primary' : 'bg-accent/50'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            collection.is_public ? 'translate-x-[20px]' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                            <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-semibold text-accent block">
                                        Удаление коллекции
                                    </span>
                                    <span className="text-xs text-muted-foreground block leading-normal">
                                        Внимание! Это действие полностью сотрет коллекцию, записи в ней и историю оценок. Восстановить данные невозможно.
                                    </span>
                                </div>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto h-10 px-4 text-xs font-semibold text-accent"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Удалить коллекцию навсегда
                                </Button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Приватность и доступ</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="access-type-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Режим доступа
                                    </Label>
                                    <Select
                                        value={privacySettings.access_type}
                                        onValueChange={(value) => setPrivacySettings({ ...privacySettings, access_type: value })}
                                    >
                                        <SelectTrigger id="access-type-select" className="w-full h-10 border-2">
                                            <SelectValue placeholder="Выберите режим доступа">
                                                {currentPrivacy?.label}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                            {privacyList.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value} className="rounded-md cursor-pointer py-2.5 focus:bg-accent/60">
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-medium text-sm text-foreground">{opt.label}</span>
                                                        <span className="text-xs text-foreground/80 mt-0.5">{opt.description}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(privacySettings.access_type === 'password' || privacySettings.access_type === 'link_and_password') && (
                                    <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                                        <Label htmlFor="collection-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Пароль коллекции
                                        </Label>
                                        <Input
                                            id="collection-password"
                                            type="password"
                                            className="w-full h-10 border-2"
                                            placeholder={hasExistingPassword ? "••••••••" : "Введите новый пароль"}
                                            value={privacySettings.password}
                                            onChange={(e) => setPrivacySettings({...privacySettings, password: e.target.value})}
                                        />
                                    </div>
                                )}
                                {(privacySettings.access_type === 'link' || privacySettings.access_type === 'link_and_password') && (
                                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                        <Button variant="outline" className="flex-1 h-9 text-sm border-2" onClick={handleGetLink}>
                                            Получить ссылку
                                        </Button>
                                        <Button variant="ghost" className="flex-1 h-9 text-sm text-muted-foreground hover:text-accent border-2" onClick={handleResetLink}>
                                            Обновить ссылку
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="pt-2">
                                <Button className="w-full h-10 font-medium" onClick={handleSavePrivacy}>
                                    Сохранить настройки
                                </Button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'membersSettings' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">Участники коллекции</h2>
                            </div>
                            {!showMembers ? (
                                <div className="flex items-center justify-center py-6 border border-border bg-muted/10 rounded-lg">
                                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="border border-border/80 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-4 bg-muted/40 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none text-center sm:text-left">
                                        <span>Имя</span>
                                        <span>Email</span>
                                        <span>Дата присоединения</span>
                                        <span className="text-right pr-2">Удалить</span>
                                    </div>
                                    {members.length > 0 ? (
                                        <div className="divide-y divide-border/60 max-h-[160px] overflow-y-auto">
                                            {members.map(member => (
                                                <div key={member.user.id} className="grid grid-cols-4 px-3 py-2.5 items-center text-xs text-foreground/90 font-medium">
                                                    <span className="truncate">{member.user.username || "Аноним"}</span>
                                                    <span className="truncate font-mono text-muted-foreground/80">
                                                        {member.user.email?.substring(0, 3)}***@***
                                                    </span>
                                                    <span className="text-muted-foreground/70 font-mono text-center sm:text-left">
                                                        {new Date(member.joined_at).toLocaleDateString()}
                                                    </span>
                                                    <div className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                            onClick={() => removeUser(member.user.id)}
                                                            title="Исключить участника"
                                                        >
                                                            <span className="block w-2.5 h-2.5 relative before:absolute before:w-full before:h-[1.5px] before:bg-current before:top-1/2 before:left-0 before:-translate-y-1/2 before:rotate-45 after:absolute after:w-full after:h-[1.5px] after:bg-current after:top-1/2 after:left-0 after:-translate-y-1/2 after:-rotate-45" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-s text-muted-foreground text-center py-6">
                                            Список участников пуст
                                        </p>
                                    )}
                                </div>
                            )}
                            {showMembers && members.length > 0 && (
                                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1 h-9 text-xs rounded-lg font-semibold text-accent"
                                        onClick={handleRemoveUsers}
                                        disabled={isUpdating}
                                    >
                                        Удалить всех
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent className="sm:max-w-[400px] p-6 gap-4">
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold tracking-tight">Вы уверены?</h3>
                            <p className="text-sm text-muted-foreground leading-normal">
                                Это действие нельзя отменить.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-border/40 mt-2">
                            <Button
                                variant="outline"
                                className="h-10 text-sm font-medium order-2 sm:order-1"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                variant="destructive"
                                className="h-10 text-sm font-medium order-1 sm:order-2"
                                onClick={confirmDelete}
                            >
                                Да, удалить
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
};

export default Collection;