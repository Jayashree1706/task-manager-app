import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchStats, fetchTasks, getErrorMessage } from '../api';
import { useAuth } from '../AuthContext';
import TaskCard from '../components/TaskCard';
import { STATUSES, colors } from '../theme';

const FILTERS = ['All', ...STATUSES];
const SORTS = [
  { key: 'created_at', label: 'Newest' },
  { key: 'priority', label: 'Priority' },
];

export default function DashboardScreen({ navigation }) {
  const { signOut } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => signOut()}>
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Logout</Text>
        </Pressable>
      ),
    });
  }, [navigation, signOut]);

  const load = useCallback(async (isRefresh = false) => {
    setError('');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = { sort_by: sortBy, order: 'desc' };
      if (filter !== 'All') params.status = filter;
      const [s, t] = await Promise.all([fetchStats(), fetchTasks(params)]);
      setStats(s);
      setTasks(t.tasks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, sortBy]);

  // Reload every time this screen comes into view (after create/edit/delete)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const StatBox = ({ label, value, color }) => (
    <View style={[styles.statBox, { borderTopColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const Header = (
    <View>
      {stats && (
        <View style={styles.statsRow}>
          <StatBox label="Total" value={stats.total} color={colors.primary} />
          <StatBox label="Pending" value={stats.pending} color={colors.Pending} />
          <StatBox label="In Progress" value={stats.in_progress} color={colors['In Progress']} />
          <StatBox label="Done" value={stats.completed} color={colors.Completed} />
        </View>
      )}

      <Pressable style={styles.newButton} onPress={() => navigation.navigate('CreateTask')}>
        <Text style={styles.newButtonText}>+ New Task</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Filter by status</Text>
      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Sort by</Text>
      <View style={styles.chipRow}>
        {SORTS.map((s) => (
          <Pressable key={s.key} onPress={() => setSortBy(s.key)} style={[styles.chip, sortBy === s.key && styles.chipActive]}>
            <Text style={[styles.chipText, sortBy === s.key && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.listTitle}>Tasks</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.muted }}>Loading tasks...</Text>
      </View>
    );
  }

  if (error && tasks.length === 0 && !stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retry} onPress={() => load()}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskCard task={item} onPress={() => navigation.navigate('TaskDetails', { id: item.id })} />
      )}
      ListHeaderComponent={Header}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {filter === 'All' ? 'No tasks yet' : `No ${filter} tasks`}
          </Text>
          <Text style={styles.emptySub}>
            {filter === 'All' ? 'Tap "+ New Task" to create your first one!' : 'Try a different filter.'}
          </Text>
        </View>
      }
      ListFooterComponent={!!error && <Text style={[styles.errorText, { marginTop: 10 }]}>{error}</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.bg },
  errorText: { color: colors.danger, textAlign: 'center' },
  retry: { marginTop: 14, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderTopWidth: 4,
    paddingVertical: 12,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  newButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginVertical: 14 },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  listTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { color: colors.muted, marginTop: 4, textAlign: 'center' },
});
