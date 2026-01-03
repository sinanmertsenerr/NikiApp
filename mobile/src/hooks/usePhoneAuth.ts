import { useState, useRef, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface UsePhoneAuthReturn {
    // State
    isLoading: boolean;
    error: string | null;
    verificationId: string | null;
    isCodeSent: boolean;
    isVerified: boolean;
    countdown: number;

    // Actions
    sendVerificationCode: (phoneNumber: string) => Promise<boolean>;
    verifyCode: (code: string) => Promise<boolean>;
    resetState: () => void;
}

export function usePhoneAuth(): UsePhoneAuthReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [countdown]);

    const sendVerificationCode = async (phoneNumber: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
            confirmationRef.current = confirmation;
            setVerificationId(confirmation.verificationId);
            setIsCodeSent(true);
            setCountdown(60); // 60 seconds cooldown for resend
            setIsLoading(false);
            return true;
        } catch (err: any) {
            console.error('Phone auth error:', err);

            // User-friendly error messages
            let errorMessage = 'SMS gönderilemedi. Lütfen tekrar deneyin.';

            if (err.code === 'auth/invalid-phone-number') {
                errorMessage = 'Geçersiz telefon numarası formatı.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.';
            } else if (err.code === 'auth/quota-exceeded') {
                errorMessage = 'SMS kotası aşıldı. Lütfen daha sonra tekrar deneyin.';
            } else if (err.code === 'auth/network-request-failed') {
                errorMessage = 'İnternet bağlantınızı kontrol edin.';
            }

            setError(errorMessage);
            setIsLoading(false);
            return false;
        }
    };

    const verifyCode = async (code: string): Promise<boolean> => {
        if (!confirmationRef.current) {
            setError('Doğrulama oturumu bulunamadı. Lütfen tekrar kod gönderin.');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            await confirmationRef.current.confirm(code);
            setIsVerified(true);
            setIsLoading(false);

            // Sign out from Firebase after verification - we only use Firebase for phone verification
            // Our app uses its own auth system (JWT)
            await auth().signOut();

            return true;
        } catch (err: any) {
            console.error('Code verification error:', err);

            let errorMessage = 'Kod doğrulanamadı. Lütfen tekrar deneyin.';

            if (err.code === 'auth/invalid-verification-code') {
                errorMessage = 'Geçersiz doğrulama kodu.';
            } else if (err.code === 'auth/code-expired') {
                errorMessage = 'Doğrulama kodunun süresi doldu. Yeni kod gönderin.';
            }

            setError(errorMessage);
            setIsLoading(false);
            return false;
        }
    };

    const resetState = () => {
        setIsLoading(false);
        setError(null);
        setVerificationId(null);
        setIsCodeSent(false);
        setIsVerified(false);
        setCountdown(0);
        confirmationRef.current = null;
        if (countdownRef.current) clearInterval(countdownRef.current);
    };

    return {
        isLoading,
        error,
        verificationId,
        isCodeSent,
        isVerified,
        countdown,
        sendVerificationCode,
        verifyCode,
        resetState,
    };
}

export default usePhoneAuth;
