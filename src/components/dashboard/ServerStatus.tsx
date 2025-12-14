'use client';

import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';

const servers = [
  {
    id: 1,
    name: 'Server-01',
    location: 'İstanbul',
    status: 'online',
    users: 156,
    load: '45%',
  },
  {
    id: 2,
    name: 'Server-02',
    location: 'Ankara',
    status: 'online',
    users: 98,
    load: '32%',
  },
  {
    id: 3,
    name: 'Server-03',
    location: 'İzmir',
    status: 'offline',
    users: 0,
    load: '0%',
  },
  {
    id: 4,
    name: 'Server-04',
    location: 'Bursa',
    status: 'online',
    users: 234,
    load: '78%',
  },
];

export function ServerStatus() {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Sunucu Durumları
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sunucu</TableCell>
              <TableCell>Konum</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell align="right">Kullanıcılar</TableCell>
              <TableCell align="right">Yük</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell>{server.name}</TableCell>
                <TableCell>{server.location}</TableCell>
                <TableCell>
                  <Chip
                    icon={<CircleIcon />}
                    label={server.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                    color={server.status === 'online' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{server.users}</TableCell>
                <TableCell align="right">{server.load}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
} 