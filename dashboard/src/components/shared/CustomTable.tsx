import { Box, Table, Flex } from '@chakra-ui/react';
import type { BoxProps, TableColumnHeaderProps, TableRowProps, TableCellProps } from '@chakra-ui/react';
import { useColorMode } from '../ui/ColorModeProvider';

interface SharedTableCardProps extends Omit<BoxProps, 'title'> {
    title?: React.ReactNode;
    headerActions?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
}

export function SharedTableCard({ title, headerActions, footer, children, ...props }: SharedTableCardProps) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Box
            bg={isDark ? '#1E1E1E' : 'white'}
            borderRadius="xl"
            border="1px solid"
            borderColor={isDark ? '#333333' : '#E0E0E0'}
            display="flex"
            flexDirection="column"
            overflow="hidden"
            color={isDark ? 'white' : 'inherit'}
            {...props}
        >
            {(title || headerActions) && (
                <Flex
                    justify="space-between"
                    align="center"
                    px={4}
                    py={3}
                    borderBottom="1px solid"
                    borderColor={isDark ? '#333333' : '#E0E0E0'}
                >
                    {title && (
                        <Box fontWeight="semibold" color={isDark ? '#FFFFFF' : '#1A1A1A'} fontSize="sm">
                            {title}
                        </Box>
                    )}
                    {headerActions && (
                        <Box>
                            {headerActions}
                        </Box>
                    )}
                </Flex>
            )}
            <Box flex={1} overflow="auto" display="flex" flexDirection="column">
                {children}
            </Box>
            {footer && (
                <Box p={4} borderTop="1px solid" borderColor={isDark ? '#333333' : '#E0E0E0'}>
                    {footer}
                </Box>
            )}
        </Box>
    );
}

// Removing unused SharedTableContainer logic since we have SharedTableCard now
// But wait, the previous SharedTableContainer was exported. I should probably replace it or keep it if needed.
// Given the user clean up request, I'll assume SharedTableCard replaces the need for a simple container.


export function SharedTableHeader({ children }: { children: React.ReactNode }) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Table.Header>
            <Table.Row bg={isDark ? '#2D2D2D' : '#FAFAFA'}>
                {children}
            </Table.Row>
        </Table.Header>
    );
}

interface SharedColumnHeaderProps extends TableColumnHeaderProps {
    children: React.ReactNode;
}

export function SharedColumnHeader({ children, ...props }: SharedColumnHeaderProps) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Table.ColumnHeader
            fontWeight="semibold"
            color={isDark ? '#B0B0B0' : '#666'}
            fontSize="xs"
            borderBottom="1px solid"
            borderColor={isDark ? '#333333' : '#E0E0E0'}
            bg={isDark ? '#2D2D2D' : '#FAFAFA'}
            position="sticky"
            top={0}
            zIndex={1}
            {...props}
        >
            {children}
        </Table.ColumnHeader>
    );
}

interface SharedTableRowProps extends TableRowProps {
    children: React.ReactNode;
}

export function SharedTableRow({ children, onClick, ...props }: SharedTableRowProps) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <Table.Row
            bg={isDark ? '#1E1E1E' : 'transparent'}
            _hover={{ bg: isDark ? '#2D2D2D' : '#FAFAFA' }}
            cursor={onClick ? 'pointer' : 'default'}
            onClick={onClick}
            transition="background 0.2s"
            {...props}
        >
            {children}
        </Table.Row>
    );
}

interface SharedTableCellProps extends TableCellProps {
    children: React.ReactNode;
}

export function SharedTableCell({ children, ...props }: SharedTableCellProps) {
    return (
        <Table.Cell {...props}>
            {children}
        </Table.Cell>
    );
}
