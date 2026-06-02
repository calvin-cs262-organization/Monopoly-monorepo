import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SERVER_URL } from '../../config';

interface Game {
  id: number;
  time: string;
}
interface Player {
  id: number;
  name: string;
  emailAddress: string;
}
interface PlayerGame {
  id: number;
  gameId: number;
  playerId: number;
  score: number;
  Player: Player;
}

export default function GamesScreen() {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<Game[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [gamePlayers, setGamePlayers] = useState<Record<number, PlayerGame[]>>(
    {},
  );
  const [gpLoading, setGpLoading] = useState<Record<number, boolean>>({});
  const [editScores, setEditScores] = useState<Record<string, string>>({});
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  // New game modal
  const [showNewGame, setShowNewGame] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Add player to game modal
  const [addPlayerGameId, setAddPlayerGameId] = useState<number | null>(null);
  const [addScore, setAddScore] = useState('0');

  const fetchGames = useCallback(() => {
    fetch(`${SERVER_URL}/Games`)
      .then((r) => r.json())
      .then(setGames)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchAllPlayers = useCallback(() => {
    fetch(`${SERVER_URL}/Players`)
      .then((r) => r.json())
      .then(setAllPlayers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchGames();
    fetchAllPlayers();
  }, [fetchGames, fetchAllPlayers]);

  const fetchGamePlayers = (gameId: number) => {
    setGpLoading((p) => ({ ...p, [gameId]: true }));
    fetch(`${SERVER_URL}/Game/${gameId}/players`)
      .then((r) => r.json())
      .then((data) => setGamePlayers((p) => ({ ...p, [gameId]: data })))
      .catch(console.error)
      .finally(() => setGpLoading((p) => ({ ...p, [gameId]: false })));
  };

  const toggleGame = (gameId: number) => {
    if (expandedId === gameId) {
      setExpandedId(null);
    } else {
      setExpandedId(gameId);
      fetchGamePlayers(gameId);
    }
  };

  const deleteGame = (gameId: number) => {
    fetch(`${SERVER_URL}/Game/${gameId}`, { method: 'DELETE' })
      .then(() => {
        setGames((prev) => prev.filter((g) => g.id !== gameId));
        if (expandedId === gameId) setExpandedId(null);
      })
      .catch(console.error);
  };

  const createGame = () => {
    const date = newDate.trim() || new Date().toISOString().slice(0, 10);
    const time = newTime.trim() || '19:00';
    const isoTime = `${date}T${time}:00`;
    fetch(`${SERVER_URL}/Game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: isoTime }),
    })
      .then((r) => r.json())
      .then((g) => {
        setGames((prev) => [g, ...prev]);
        setShowNewGame(false);
        setNewDate('');
        setNewTime('');
      })
      .catch(console.error);
  };

  const removePlayer = (gameId: number, playerId: number) => {
    fetch(`${SERVER_URL}/Game/${gameId}/player/${playerId}`, {
      method: 'DELETE',
    })
      .then(() =>
        setGamePlayers((prev) => ({
          ...prev,
          [gameId]: prev[gameId].filter((gp) => gp.playerId !== playerId),
        })),
      )
      .catch(console.error);
  };

  const saveScore = (gameId: number, playerId: number) => {
    const key = `${gameId}-${playerId}`;
    const score = parseInt(editScores[key] ?? '0', 10) || 0;
    fetch(`${SERVER_URL}/Game/${gameId}/player/${playerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
      .then(() =>
        setGamePlayers((prev) => ({
          ...prev,
          [gameId]: prev[gameId].map((gp) =>
            gp.playerId === playerId ? { ...gp, score } : gp,
          ),
        })),
      )
      .catch(console.error);
  };

  const addPlayerToGame = (gameId: number, playerId: number) => {
    const score = parseInt(addScore, 10) || 0;
    fetch(`${SERVER_URL}/Game/${gameId}/player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, score }),
    })
      .then(() => fetchGamePlayers(gameId))
      .catch(console.error);
    setAddPlayerGameId(null);
    setAddScore('0');
  };

  const playersNotInGame = (gameId: number) => {
    const inGame = new Set(
      (gamePlayers[gameId] ?? []).map((gp) => gp.playerId),
    );
    return allPlayers.filter((p) => !inGame.has(p.id));
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator
          color='#ffd33d'
          size='large'
        />
      </View>
    );

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={s.primaryBtn}
        onPress={() => setShowNewGame(true)}
      >
        <Ionicons
          name='add-circle-outline'
          size={20}
          color='#25292e'
        />
        <Text style={s.primaryBtnText}>New Game</Text>
      </TouchableOpacity>

      <FlatList
        data={games}
        keyExtractor={(g) => g.id.toString()}
        style={s.list}
        renderItem={({ item: game }) => {
          const isOpen = expandedId === game.id;
          const players = gamePlayers[game.id] ?? [];
          return (
            <View style={s.card}>
              <View style={s.cardRow}>
                <TouchableOpacity
                  style={s.cardMain}
                  onPress={() => toggleGame(game.id)}
                >
                  <Ionicons
                    name={isOpen ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color='#aaa'
                    style={{ marginRight: 6 }}
                  />
                  <Text style={s.gameLabel}>{formatTime(game.time)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteGame(game.id)}
                  style={s.iconBtn}
                >
                  <Ionicons
                    name='trash-outline'
                    size={18}
                    color='#e55'
                  />
                </TouchableOpacity>
              </View>

              {isOpen && (
                <View style={s.detail}>
                  {gpLoading[game.id] ? (
                    <ActivityIndicator color='#ffd33d' />
                  ) : (
                    <>
                      {players.map((gp) => {
                        const key = `${game.id}-${gp.playerId}`;
                        const scoreVal = editScores[key] ?? String(gp.score);
                        return (
                          <View
                            key={gp.playerId}
                            style={s.playerRow}
                          >
                            <Text
                              style={s.playerName}
                              numberOfLines={1}
                            >
                              {gp.Player?.name}
                            </Text>
                            <TextInput
                              style={s.scoreInput}
                              value={scoreVal}
                              onChangeText={(v) =>
                                setEditScores((prev) => ({ ...prev, [key]: v }))
                              }
                              onSubmitEditing={() =>
                                saveScore(game.id, gp.playerId)
                              }
                              onBlur={() => saveScore(game.id, gp.playerId)}
                              keyboardType='numeric'
                              returnKeyType='done'
                            />
                            <TouchableOpacity
                              onPress={() => removePlayer(game.id, gp.playerId)}
                              style={s.iconBtn}
                            >
                              <Ionicons
                                name='trash-outline'
                                size={16}
                                color='#e55'
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                      <TouchableOpacity
                        style={s.addPlayerBtn}
                        onPress={() => {
                          setAddPlayerGameId(game.id);
                          setAddScore('0');
                        }}
                      >
                        <Ionicons
                          name='person-add-outline'
                          size={15}
                          color='#ffd33d'
                        />
                        <Text style={s.addPlayerText}>Add Player</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* ── New Game Modal ── */}
      <Modal
        visible={showNewGame}
        transparent
        animationType='fade'
        onRequestClose={() => setShowNewGame(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>New Game</Text>
            <Text style={s.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input}
              placeholder={new Date().toISOString().slice(0, 10)}
              placeholderTextColor='#666'
              value={newDate}
              onChangeText={setNewDate}
            />
            <Text style={s.label}>Time (HH:MM)</Text>
            <TextInput
              style={s.input}
              placeholder='19:00'
              placeholderTextColor='#666'
              value={newTime}
              onChangeText={setNewTime}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowNewGame(false)}
                style={s.cancelBtn}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createGame}
                style={s.confirmBtn}
              >
                <Text style={s.confirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Player to Game Modal ── */}
      <Modal
        visible={addPlayerGameId !== null}
        transparent
        animationType='fade'
        onRequestClose={() => setAddPlayerGameId(null)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Add Player to Game</Text>
            <Text style={s.label}>Starting Score</Text>
            <TextInput
              style={s.input}
              value={addScore}
              onChangeText={setAddScore}
              keyboardType='numeric'
              returnKeyType='done'
            />
            <Text style={[s.label, { marginTop: 12 }]}>Select Player</Text>
            <ScrollView style={{ maxHeight: 240 }}>
              {addPlayerGameId !== null &&
                playersNotInGame(addPlayerGameId).length === 0 && (
                  <Text style={s.emptyText}>
                    All players are already in this game.
                  </Text>
                )}
              {addPlayerGameId !== null &&
                playersNotInGame(addPlayerGameId).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={s.playerOption}
                    onPress={() => addPlayerToGame(addPlayerGameId, p.id)}
                  >
                    <Text style={s.playerOptionName}>{p.name}</Text>
                    <Text style={s.playerOptionEmail}>{p.emailAddress}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setAddPlayerGameId(null)}
              style={[s.cancelBtn, { marginTop: 12, alignSelf: 'flex-end' }]}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25292e' },
  center: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flex: 1 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd33d',
    alignSelf: 'flex-start',
    margin: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnText: {
    marginLeft: 6,
    fontWeight: 'bold',
    color: '#25292e',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#2e3338',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  gameLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  iconBtn: { padding: 4, marginLeft: 8 },
  detail: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3f44',
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  playerName: { flex: 1, color: '#ddd', fontSize: 14 },
  scoreInput: {
    color: '#ffd33d',
    borderBottomWidth: 1,
    borderBottomColor: '#ffd33d',
    width: 64,
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 2,
    marginRight: 4,
  },
  addPlayerBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  addPlayerText: { color: '#ffd33d', marginLeft: 6, fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2e3338',
    borderRadius: 12,
    padding: 20,
    width: '88%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: { color: '#aaa', fontSize: 13, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#3a3f44',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelText: { color: '#aaa', fontSize: 15 },
  confirmBtn: {
    backgroundColor: '#ffd33d',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  confirmText: { color: '#25292e', fontWeight: 'bold', fontSize: 15 },
  playerOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3f44',
  },
  playerOptionName: { color: '#fff', fontSize: 15 },
  playerOptionEmail: { color: '#aaa', fontSize: 12, marginTop: 1 },
  emptyText: { color: '#aaa', fontSize: 14, marginVertical: 8 },
});
