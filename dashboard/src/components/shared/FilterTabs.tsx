import { Flex, Button } from '@chakra-ui/react';
import { useColorMode } from '../ui/ColorModeProvider';
import type { FilterTabsProps } from '../../types';

export function FilterTabs({ options, activeFilter, onChange, size = 'xs', bg }: FilterTabsProps) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Flex
            p={1}
            bg={bg || (isDark ? '#2D2D2D' : '#F5F5F5')}
            borderRadius="lg"
            w="fit-content"
            gap={1}
        >
            {options.map((option) => (
                <Button
                    key={option.key}
                    size={size}
                    variant={activeFilter === option.key ? 'solid' : 'ghost'}
                    bg={activeFilter === option.key ? (isDark ? '#4A4A4A' : 'white') : 'transparent'}
                    color={activeFilter === option.key ? (isDark ? 'white' : 'black') : (isDark ? '#B0B0B0' : '#666')}
                    shadow={activeFilter === option.key ? 'sm' : 'none'}
                    onClick={() => onChange(option.key)}
                    borderRadius="md"
                    px={3}
                    _hover={{
                        bg: activeFilter === option.key
                            ? (isDark ? '#4A4A4A' : 'white')
                            : (isDark ? '#333' : 'gray.100')
                    }}
                >
                    {option.label}
                </Button>
            ))}
        </Flex>
    );
}
