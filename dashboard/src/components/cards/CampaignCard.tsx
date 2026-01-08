import { Box, Flex, Text, Badge, Icon, Progress } from '@chakra-ui/react';
import { LuCircleCheck, LuCircleX, LuClock, LuTag, LuCalendar } from 'react-icons/lu';
import { useColorMode } from '../ui/ColorModeProvider';

interface Campaign {
    id: number;
    name: string;
    description: string;
    type: string;
    discount: number;
    discountType: 'percent' | 'fixed';
    status: 'active' | 'ended' | 'paused';
    endDate: string;
    totalAssigned: number;
    totalUsed: number;
    totalSavings: number;
}

interface CampaignCardProps {
    campaign: Campaign;
    onClick?: () => void;
}

const statusConfig = {
    active: { label: 'Aktif', color: 'green', icon: LuCircleCheck },
    ended: { label: 'Sona Erdi', color: 'gray', icon: LuCircleX },
    paused: { label: 'Duraklatıldı', color: 'orange', icon: LuClock },
};

const typeConfig: Record<string, { label: string; color: string }> = {
    welcome: { label: 'Hoş Geldin', color: '#3B82F6' },
    weekend: { label: 'Hafta Sonu', color: '#8B5CF6' },
    student: { label: 'Öğrenci', color: '#FF9800' },
    birthday: { label: 'Doğum Günü', color: '#EC4899' },
    seasonal: { label: 'Sezonluk', color: '#4CAF50' },
    timebased: { label: 'Zaman Bazlı', color: '#666666' },
};

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const status = statusConfig[campaign.status];
    const type = typeConfig[campaign.type] || { label: campaign.type, color: '#666' };
    const usagePercent = campaign.totalAssigned > 0
        ? (campaign.totalUsed / campaign.totalAssigned) * 100
        : 0;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2
        }).format(value);

    return (
        <Box
            bg={isDark ? '#1E1E1E' : 'white'}
            borderRadius="xl"
            border="1px solid"
            borderColor={isDark ? '#333333' : '#E0E0E0'}
            p={4}
            _hover={{
                borderColor: isDark ? '#4A4A4A' : '#BDBDBD',
                shadow: 'sm'
            }}
            transition="all 0.2s"
            cursor={onClick ? 'pointer' : 'default'}
            onClick={onClick}
        >
            {/* Header */}
            <Flex justify="space-between" align="flex-start" mb={2}>
                <Flex align="center" gap={2}>
                    <Badge bg={type.color} color="white" fontSize="xs" px={2} borderRadius="md">
                        {type.label}
                    </Badge>
                    <Badge colorPalette={status.color} variant="subtle" fontSize="xs">
                        <Flex align="center" gap={1}>
                            <Icon as={status.icon} boxSize={3} />
                            {status.label}
                        </Flex>
                    </Badge>
                </Flex>
                <Flex
                    bg={isDark ? '#3D2D1A' : '#FFF3E0'}
                    borderRadius="lg"
                    px={2}
                    py={1}
                    align="center"
                    gap={1}
                >
                    <Icon as={LuTag} boxSize={3} color="#FF9800" />
                    <Text fontWeight="bold" color="#FF9800" fontSize="xs">
                        {campaign.discountType === 'percent'
                            ? `%${campaign.discount}`
                            : `${campaign.discount}₺`}
                    </Text>
                </Flex>
            </Flex>

            {/* Title */}
            <Text
                fontWeight="semibold"
                color={isDark ? 'white' : '#1A1A1A'}
                fontSize="sm"
                mb={1}
            >
                {campaign.name}
            </Text>
            <Text
                color={isDark ? '#808080' : '#666666'}
                fontSize="xs"
                mb={3}
                lineClamp={1}
            >
                {campaign.description}
            </Text>

            {/* Usage Progress */}
            <Box mb={3}>
                <Flex justify="space-between" mb={1}>
                    <Text fontSize="xs" color={isDark ? '#808080' : '#666666'}>
                        Kullanım
                    </Text>
                    <Text fontSize="xs" color={isDark ? '#B0B0B0' : '#666666'}>
                        {campaign.totalUsed}/{campaign.totalAssigned}
                    </Text>
                </Flex>
                <Progress.Root value={usagePercent} size="sm" borderRadius="full">
                    <Progress.Track bg={isDark ? '#333333' : '#E0E0E0'}>
                        <Progress.Range
                            bg={campaign.status === 'active' ? '#4CAF50' : '#9e9e9e'}
                        />
                    </Progress.Track>
                </Progress.Root>
            </Box>

            {/* Footer */}
            <Flex
                justify="space-between"
                pt={2}
                borderTop="1px solid"
                borderColor={isDark ? '#333333' : '#F0F0F0'}
            >
                <Box>
                    <Text fontSize="xs" color={isDark ? '#666666' : '#999999'}>
                        Tasarruf
                    </Text>
                    <Text fontSize="xs" fontWeight="semibold" color="#4CAF50">
                        {formatCurrency(campaign.totalSavings)}
                    </Text>
                </Box>
                <Box textAlign="right">
                    <Text fontSize="xs" color={isDark ? '#666666' : '#999999'}>
                        Bitiş
                    </Text>
                    <Flex align="center" gap={1}>
                        <Icon
                            as={LuCalendar}
                            boxSize={3}
                            color={isDark ? '#808080' : '#666666'}
                        />
                        <Text fontSize="xs" color={isDark ? '#B0B0B0' : '#666666'}>
                            {new Date(campaign.endDate).toLocaleDateString('tr-TR')}
                        </Text>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    );
}

export default CampaignCard;
