import { Box, Text } from '@chakra-ui/react';
import { useColorMode } from '../ui/ColorModeProvider';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
            <Box>
                <Text fontSize="2xl" fontWeight="bold" color={isDark ? 'white' : 'gray.800'}>
                    {title}
                </Text>
                {subtitle && (
                    <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'} mt={1}>
                        {subtitle}
                    </Text>
                )}
            </Box>
            {children && <Box>{children}</Box>}
        </Box>
    );
}
