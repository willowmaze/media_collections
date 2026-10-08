import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Forbidden, LoadingScreen } from './Errors';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const AccessGuard = ({ collectionId, children }) => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');

    const inviteToken = searchParams.get('invite_token');

    const tryJoin = async (pwd = null) => {
        try {
            const res = await api.post(`/collections/${collectionId}/join`, {
                invite_token: inviteToken,
                password: pwd || password || null
                });
            if (res.data.status === "success" || res.data.detail === "Already joined") {
                setStatus("granted");
                }
            } catch (err) {
                const data = err.response?.data;
                const detail = data?.detail;
                if (detail === "PASSWORD_REQUIRED" || detail === "INVALID_PASSWORD") {
                    setStatus("password_required");
                    if (detail === "INVALID_PASSWORD") setError("Неверный пароль");
                } else if (detail === "INVALID_TOKEN") {
                    setStatus("forbidden");
                    setError("Ссылка недействительна или устарела");
                } else if (detail === "Already joined") {
                    setStatus("granted");
                } else {
                    setStatus("forbidden");
                    setError("Произошла ошибка");
                }
        }
    };

    useEffect(() => {
       if (inviteToken || collectionId) {
           tryJoin();
       }
    }, [collectionId, inviteToken]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        tryJoin(password);
    };

    if (status === 'loading') return <LoadingScreen></LoadingScreen>;
    if (status === 'forbidden') return <Forbidden></Forbidden>;
    if (status === 'granted') return children;

    return (
        <div>
            {status === 'password_required' ? (
                <form className="access-view" onSubmit={handlePasswordSubmit}>
                    <h1>Требуется пароль</h1>
                    Владелец ограничил доступ к этой коллекции паролем.
                    <input
                        type="password"
                        className="access-input"
                        placeholder="Введите пароль..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                    {error && <span className="error-msg">{error}</span>}
                    <button type="submit" className="btn-access">Войти в коллекцию</button>
                </form>
            ) : (
            <Forbidden></Forbidden>
        )}
    </div>
    );
};

export default AccessGuard;