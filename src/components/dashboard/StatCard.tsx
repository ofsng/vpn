'use client';

import { Paper, Typography, Box } from '@mui/material';
import {
  People as PeopleIcon,
  Link as LinkIcon,
  Storage as StorageIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string;
  icon: 'users' | 'connection' | 'server' | 'money';
  trend: string;
}

const iconMap = {
  users: PeopleIcon,
  connection: LinkIcon,
  server: StorageIcon,
  money: MoneyIcon,
};

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  const Icon = iconMap[icon];

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: 140,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography color="text.secondary" variant="subtitle2">
          {title}
        </Typography>
        <Icon color="primary" />
      </Box>
      <Typography component="p" variant="h4">
        {value}
      </Typography>
      <Typography color="text.secondary" sx={{ flex: 1 }}>
        {trend}
      </Typography>
    </Paper>
  );
} 