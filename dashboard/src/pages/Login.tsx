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

export function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

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

            login(response.user, response.accessToken, response.refreshToken);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex minH="100vh" bg="gray.50" align="center" justify="center" p={4}>
            <Box
                bg="white"
                p={8}
                borderRadius="2xl"
                shadow="xl"
                w="full"
                maxW="400px"
            >
                {/* Logo */}
                <VStack mb={8}>
                    <Flex
                        w={16}
                        h={16}
                        align="center"
                        justify="center"
                        borderRadius="2xl"
                        bgGradient="linear(to-br, brand.500, brand.600)"
                        mb={2}
                    >
                        <Icon as={LuCat} boxSize={8} color="white" />
                    </Flex>
                    <Text fontWeight="bold" fontSize="2xl" color="gray.900">
                        NikiTheCat
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                        Analytics Portal
                    </Text>
                </VStack>

                {/* Error */}
                {error && (
                    <Flex
                        bg="red.50"
                        border="1px solid"
                        borderColor="red.200"
                        borderRadius="lg"
                        p={3}
                        mb={4}
                        align="center"
                    >
                        <Icon as={LuTriangleAlert} color="red.500" mr={2} />
                        <Text fontSize="sm" color="red.700">{error}</Text>
                    </Flex>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <VStack gap={4}>
                        <Box w="full">
                            <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                                E-posta
                            </Text>
                            <Flex
                                align="center"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="lg"
                                px={3}
                                _focusWithin={{ borderColor: 'brand.500', shadow: 'outline' }}
                            >
                                <Icon as={LuMail} color="gray.400" mr={2} />
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    border="none"
                                    _focus={{ boxShadow: 'none' }}
                                    required
                                />
                            </Flex>
                        </Box>

                        <Box w="full">
                            <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                                Şifre
                            </Text>
                            <Flex
                                align="center"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="lg"
                                px={3}
                                _focusWithin={{ borderColor: 'brand.500', shadow: 'outline' }}
                            >
                                <Icon as={LuLock} color="gray.400" mr={2} />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    border="none"
                                    _focus={{ boxShadow: 'none' }}
                                    required
                                />
                            </Flex>
                        </Box>

                        <Button
                            type="submit"
                            colorPalette="purple"
                            size="lg"
                            w="full"
                            loading={isLoading}
                            loadingText="Giriş yapılıyor..."
                        >
                            Giriş Yap
                        </Button>
                    </VStack>
                </form>

                <Text fontSize="xs" color="gray.500" textAlign="center" mt={6}>
                    Bu panel sadece yöneticiler içindir.
                </Text>
            </Box>
        </Flex>
    );
}

export default LoginPage;
