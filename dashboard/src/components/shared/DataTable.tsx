import React from 'react';
import { Table, Flex, Text, Box } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import {
    SharedTableCard,
    SharedTableHeader,
    SharedColumnHeader,
    SharedTableRow,
} from './CustomTable';
import { useColorMode } from '../ui/ColorModeProvider';
import type { ColumnDef } from '../../types';

interface DataTableProps<T> extends Omit<BoxProps, 'columns'> {
    data: T[];
    columns: ColumnDef<T>[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    keyExtractor: (item: T) => string | number;
}

export function DataTable<T>({
    data,
    columns,
    onRowClick,
    emptyMessage = "Veri bulunamadı",
    keyExtractor,
    ...props
}: DataTableProps<T>) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    return (
        <SharedTableCard {...props}>
            <Table.Root size="sm" stickyHeader>
                <SharedTableHeader>
                    {columns.map((col, index) => (
                        <SharedColumnHeader
                            key={index}
                            width={col.width || 'auto'}
                            textAlign={col.textAlign || 'left'}
                        >
                            {col.header}
                        </SharedColumnHeader>
                    ))}
                </SharedTableHeader>
                <Table.Body>
                    {data.length === 0 ? (
                        <SharedTableRow>
                            <Table.Cell colSpan={columns.length}>
                                <Flex justify="center" py={4}>
                                    <Text color={isDark ? '#808080' : '#666666'} fontSize="sm">
                                        {emptyMessage}
                                    </Text>
                                </Flex>
                            </Table.Cell>
                        </SharedTableRow>
                    ) : (
                        data.map((item) => (
                            <SharedTableRow
                                key={keyExtractor(item)}
                                onClick={onRowClick ? () => onRowClick(item) : undefined}
                            >
                                {columns.map((col, index) => (
                                    <Table.Cell
                                        key={index}
                                        textAlign={col.textAlign || 'left'}
                                    >
                                        {col.cell
                                            ? col.cell(item)
                                            : col.accessorKey
                                                ? (item[col.accessorKey] as React.ReactNode)
                                                : null
                                        }
                                    </Table.Cell>
                                ))}
                            </SharedTableRow>
                        ))
                    )}
                </Table.Body>
            </Table.Root>
        </SharedTableCard>
    );
}
