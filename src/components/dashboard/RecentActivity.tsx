'use client';

import { Typography, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import {
  Person as PersonIcon,
  Storage as StorageIcon,
  Key as KeyIcon,
} from '@mui/icons-material';

const activities = [
  {
    id: 1,
    type: 'user',
    text: 'Yeni kullanıcı kaydı: Ahmet Yılmaz',
    time: '5 dakika önce',
    icon: PersonIcon,
  },
  {
    id: 2,
    type: 'server',
    text: 'Sunucu durumu güncellendi: Server-01',
    time: '15 dakika önce',
    icon: StorageIcon,
  },
  {
    id: 3,
    type: 'license',
    text: 'Yeni lisans oluşturuldu: LIC-123456',
    time: '1 saat önce',
    icon: KeyIcon,
  },
  {
    id: 4,
    type: 'user',
    text: 'Kullanıcı girişi: Mehmet Demir',
    time: '2 saat önce',
    icon: PersonIcon,
  },
];

export function RecentActivity() {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Son Aktiviteler
      </Typography>
      <List>
        {activities.map((activity, index) => (
          <div key={activity.id}>
            <ListItem>
              <ListItemIcon>
                <activity.icon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={activity.text}
                secondary={activity.time}
              />
            </ListItem>
            {index < activities.length - 1 && <Divider />}
          </div>
        ))}
      </List>
    </>
  );
} 