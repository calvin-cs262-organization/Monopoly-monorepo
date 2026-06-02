import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SERVER_URL } from '../../config';

interface Game { id: number; time: string; }
interface PlayerGame { id: number; gameId: number; playerId: number; score: number; Game: Game; }
interface Player {
  id: number;
  name: string;
  emailAddress: string;
  PlayerGame?: [{ count: number }];
}

export default function PlayersScreen() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [playerGames, setPlayerGames] = useState<Record<number, PlayerGame[]>>({});
  const [pgLoading, setPgLoading] = useState<Record<number, boolean>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const fetchPlayers = useCallback(() => {
    fetch(`${SERVER_URL}/Players`)
      .then(r => r.json())
      .then(setPlayers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const fetchPlayerGames = (playerId: number) => {
    setPgLoading(p => ({ ...p, [playerId]: true }));
    fetch(`${SERVER_URL}/Player/${playerId}/games`)
      .then(r => r.json())
      .then(data => setPlayerGames(p => ({ ...p, [playerId]: data })))
      .catch(console.error)
      .finally(() => setPgLoading(p => ({ ...p, [playerId]: false })));
  };

  const togglePlayer = (playerId: number) => {
    if (expandedId === playerId) {
      setExpandedId(null);
    } else {
      setExpandedId(playerId);
      fetchPlayerGames(playerId);
    }
  };

  const deletePlayer = (id: number) => {
    fetch(`${SERVER_URL}/Player/${id}`, { method: 'DELETE' })
      .then(() => {
        setPlayers(prev => prev.filter(p => p.id !== id));
        if (expandedId === id) setExpandedId(null);
      })
      .catch(console.error);
  };

  const addPlayer = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    fetch(`${SERVER_URL}/Player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), emailAddress: newEmail.trim() }),
    })
      .then(r => r.json())
      .then(p => {
        setPlayers(prev => [...prev, { ...p, PlayerGame: [{ count: 0 }] }]
          .sort((a, b) => a.name.localeCompare(b.name)));
        setShowAdd(false);
        setNewName('');
        setNewEmail('');
      })
      .catch(console.error);
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return iso; }
  };

  const gameCount = (p: Player) => p.PlayerGame?.[0]?.count ?? 0;

  if (loading) return <View style={s.center}><ActivityIndicator color="#ffd33d" size="large" /></View>;

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.primaryBtn} onPress={() => setShowAdd(true)}>
        <Ionicons name="person-add-outline" size={20} color="#25292e" />
        <Text style={s.primaryBtnText}>Add Player</Text>
      </TouchableOpacity>

      <FlatList
        data={players}
        keyExtractor={p => p.id.toString()}
        style={s.list}
        renderItem={({ item: player }) => {
          const isOpen = expandedId === player.id;
          const games = playerGames[player.id] ?? [];
          return (
            <View style={s.card}>
              <View style={s.cardRow}>
                <TouchableOpacity style={s.cardMain} onPress={() => togglePlayer(player.id)}>
                  <Ionicons
                    name={isOpen ? 'chevron-down' : 'chevron-forward'}
                    size={16} color="#aaa" style={{ marginRight: 6 }}
                  />
                  <View style={s.playerInfo}>
                    <Text style={s.name}>{player.name}</Text>
                    <Text style={s.email}>{player.emailAddress}</Text>
                  </View>
                  <Text style={s.gameCount}>
                    {gameCount(player)} {gameCount(player) === 1 ? 'game' : 'games'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deletePlayer(player.id)} style={s.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color="#e55" />
                </TouchableOpacity>
              </View>

              {isOpen && (
                <View style={s.detail}>
                  {pgLoading[player.id] ? (
                    <ActivityIndicator color="#ffd33d" />
                  ) : games.length === 0 ? (
                    <Text style={s.emptyText}>No games yet.</Text>
                  ) : (
                    games.map(pg => (
                      <View key={pg.id} style={s.gameRow}>
                        <Text style={s.gameTime}>{formatTime(pg.Game?.time)}</Text>
                        <Text style={s.gameScore}>{pg.score} pts</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Add Player</Text>
            <Text style={s.label}>Name</Text>
            <TextInput
              style={s.input}
              placeholder="Full name"
              placeholderTextColor="#666"
              value={newName}
              onChangeText={setNewName}
            />
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="email@example.com"
              placeholderTextColor="#666"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                onPress={() => { setShowAdd(false); setNewName(''); setNewEmail(''); }}
                style={s.cancelBtn}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addPlayer} style={s.confirmBtn}>
                <Text style={s.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25292e' },
  center: { flex: 1, backgroundColor: '#25292e', alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffd33d',
    alignSelf: 'flex-start', margin: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  primaryBtnText: { marginLeft: 6, fontWeight: 'bold', color: '#25292e', fontSize: 15 },
  card: { backgroundColor: '#2e3338', marginHorizontal: 12, marginBottom: 6, borderRadius: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  playerInfo: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  email: { color: '#aaa', fontSize: 13, marginTop: 1 },
  gameCount: { color: '#ffd33d', fontSize: 13, marginRight: 8 },
  iconBtn: { padding: 4 },
  detail: { paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#3a3f44' },
  gameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 },
  gameTime: { color: '#ddd', fontSize: 14 },
  gameScore: { color: '#ffd33d', fontSize: 14 },
  emptyText: { color: '#aaa', fontSize: 14, paddingVertical: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#2e3338', borderRadius: 12, padding: 20, width: '88%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#3a3f44', color: '#fff', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 15,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelText: { color: '#aaa', fontSize: 15 },
  confirmBtn: { backgroundColor: '#ffd33d', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8 },
  confirmText: { color: '#25292e', fontWeight: 'bold', fontSize: 15 },
});
