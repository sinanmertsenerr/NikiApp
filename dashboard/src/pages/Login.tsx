'use client';

import { useState } from 'react';
import {
    Box,
    Flex,
    VStack,
    Text,
    Input,
    Button,
    Icon,
} from '@chakra-ui/react';
import { LuCat, LuMail, LuLock, LuTriangleAlert } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuthStore } from '../store';
import { useColorMode } from '../components/ui/ColorModeProvider';
import { connectSocket } from '../socket';

export function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authApi.login({ identifier, password });

            // Check if user is admin
            if (response.user.role !== 'admin' && response.user.role !== 'super_admin') {
                setError('Bu panele sadece yöneticiler erişebilir.');
                return;
            }

            // Store login info
            login(response.user, response.accessToken, response.refreshToken);

            // Connect socket immediately with new token
            connectSocket(response.accessToken);

            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex minH="100vh" bg={isDark ? '#121212' : 'gray.50'} align="center" justify="center" p={4} transition="background 0.2s">
            <Box
                bg={isDark ? '#1E1E1E' : 'white'}
                p={8}
                borderRadius="2xl"
                shadow="xl"
                w="full"
                maxW="400px"
                border="1px solid"
                borderColor={isDark ? '#333333' : 'transparent'}
                transition="all 0.2s"
            >
                {/* Logo */}
                <VStack mb={8} gap={3}>
                    <img
                        src="/images/brands/niki-logo.png"
                        alt="NikiTheCat"
                        style={{
                            height: '64px',
                            filter: isDark ? 'invert(1)' : 'none'
                        }}
                    />
                    <VStack gap={0}>
                        <Text fontWeight="bold" fontSize="2xl" color={isDark ? '#FFFFFF' : '#1A1A1A'}>
                            NikiTheCat
                        </Text>
                        <Text fontSize="sm" color={isDark ? '#B0B0B0' : '#666666'}>
                            Analytics Portal
                        </Text>
                    </VStack>
                </VStack>

                {/* Error */}
                {error && (
                    <Flex
                        bg={isDark ? 'rgba(244, 67, 54, 0.1)' : 'red.50'}
                        border="1px solid"
                        borderColor={isDark ? 'rgba(244, 67, 54, 0.3)' : 'red.200'}
                        borderRadius="lg"
                        p={3}
                        mb={4}
                        align="center"
                    >
                        <Icon as={LuTriangleAlert} color="red.500" mr={2} />
                        <Text fontSize="sm" color={isDark ? 'red.300' : 'red.700'}>{error}</Text>
                    </Flex>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <VStack gap={4}>
                        <Box w="full">
                            <Text fontSize="sm" fontWeight="medium" mb={2} color={isDark ? '#B0B0B0' : 'gray.700'}>
                                E-posta
                            </Text>
                            <Flex
                                align="center"
                                border="1px solid"
                                borderColor={isDark ? '#333333' : 'gray.200'}
                                borderRadius="lg"
                                px={3}
                                bg={isDark ? '#2D2D2D' : 'transparent'}
                                _focusWithin={{ borderColor: isDark ? 'white' : 'black', shadow: 'outline' }}
                            >
                                <Icon as={LuMail} color={isDark ? '#808080' : 'gray.400'} mr={2} />
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    border="none"
                                    color={isDark ? '#FFFFFF' : 'inherit'}
                                    _placeholder={{ color: isDark ? '#666666' : 'gray.400' }}
                                    _focus={{ boxShadow: 'none' }}
                                    required
                                />
                            </Flex>
                        </Box>

                        <Box w="full">
                            <Text fontSize="sm" fontWeight="medium" mb={2} color={isDark ? '#B0B0B0' : 'gray.700'}>
                                Şifre
                            </Text>
                            <Flex
                                align="center"
                                border="1px solid"
                                borderColor={isDark ? '#333333' : 'gray.200'}
                                borderRadius="lg"
                                px={3}
                                bg={isDark ? '#2D2D2D' : 'transparent'}
                                _focusWithin={{ borderColor: isDark ? 'white' : 'black', shadow: 'outline' }}
                            >
                                <Icon as={LuLock} color={isDark ? '#808080' : 'gray.400'} mr={2} />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    border="none"
                                    color={isDark ? '#FFFFFF' : 'inherit'}
                                    _placeholder={{ color: isDark ? '#666666' : 'gray.400' }}
                                    _focus={{ boxShadow: 'none' }}
                                    required
                                />
                            </Flex>
                        </Box>

                        <Button
                            type="submit"
                            size="lg"
                            w="full"
                            bg={isDark ? 'white' : 'black'}
                            color={isDark ? 'black' : 'white'}
                            _hover={{
                                bg: isDark ? 'gray.200' : 'gray.800',
                                transform: 'translateY(-1px)'
                            }}
                            transition="all 0.2s"
                            loading={isLoading}
                            loadingText="Giriş yapılıyor..."
                        >
                            Giriş Yap
                        </Button>
                    </VStack>
                </form>

                <Text fontSize="xs" color={isDark ? '#808080' : 'gray.500'} textAlign="center" mt={6}>
                    Bu panel sadece yöneticiler içindir.
                </Text>
            </Box>
        </Flex>
    );
}

export default LoginPage;

