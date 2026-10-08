import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './AuthContext';
import { pictureBaseUrl } from '../api';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Navbar = () => {
    const { user, logout } = useAuth();

    const getAvatarSrc = (url) => {
        if (!url) return null;
        if (url.startsWith('blob:')) return url;
        if (url.startsWith('http')) return url;
        return `${pictureBaseUrl}${url}`;
    };

    return (
        <NavigationMenu className="w-full max-w-full border-b border-border px-6 py-3">
            <NavigationMenuList className="w-full flex items-center gap-4">
                <NavigationMenuItem>
                    <Link to="/" className="font-bold tracking-tight text-lg">
                        Media Collections
                    </Link>
                </NavigationMenuItem>

                <div className="flex-grow" />
                    <NavigationMenuItem>
                        <ThemeToggle />
                    </NavigationMenuItem>
                        {user ? (
                            <>
                                <NavigationMenuItem>
                                    <Link to="/profile">{user.username ? user.username : "Аноним"}</Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                <Avatar size="lg" className="bg-popover flex justify-center">
                                    {user.avatar_url ? (
                                        <AvatarImage src={getAvatarSrc(user.avatar_url)}  alt="Avatar" />
                                        ) : (
                                            <span className="text-2xl font-bold text-muted-foreground/80 tracking-tight">
                                                {user.username ? user.username[0].toUpperCase() : "A"}
                                            </span>
                                    )}
                                </Avatar>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Button onClick={logout}>Выйти</Button>
                                </NavigationMenuItem>
                            </>
                        ) : (
                            <>
                            <NavigationMenuItem><Link to="/login">Войти</Link></NavigationMenuItem>
                            <NavigationMenuItem><Link to="/register">Регистрация</Link></NavigationMenuItem>
                            </>
                        )}
            </NavigationMenuList>
        </NavigationMenu>
    );
};

export default Navbar;