import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteTask, fetchTask, getErrorMessage, updateTaskStatus } from '../api';
import { STATUSES, colors } from '../theme';

export default function TaskDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTask(await fetchTask(id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload after coming back from the Edit screen
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const changeStatus = async (status) => {
    if (status === task.status) return;
    setBusy(true);
    setError('');
    try {
      setTask(await updateTaskStatus(id, status));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete task', 'Are you sure you want to delete this task? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteTask(id);
            navigation.goBack();
          } catch (err) {
            setError(getErrorMessage(err));
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading && !task) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.muted }}>Loading task...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger, textAlign: 'center' }}>{error || 'Task not found'}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const created = new Date(task.created_at).toLocaleString();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{task.title}</Text>

      <View style={styles.row}>
        <Text style={[styles.badge, { backgroundColor: colors[task.status] }]}>{task.status}</Text>
        <Text style={[styles.badge, { backgroundColor: colors[task.priority] }]}>{task.priority} priority</Text>
      </View>

      <Text style={styles.label}>Description</Text>
      <Text style={styles.value}>{task.description || 'No description'}</Text>

      <Text style={styles.label}>Due date</Text>
      <Text style={styles.value}>{task.due_date || 'Not set'}</Text>

      <Text style={styles.label}>Created at</Text>
      <Text style={styles.value}>{created}</Text>

      <Text style={styles.label}>Change status</Text>
      <View style={styles.row}>
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            disabled={busy}
            onPress={() => changeStatus(s)}
            style={[styles.chip, task.status === s && styles.chipActive]}
          >
            <Text style={[styles.chipText, task.status === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {busy && <ActivityIndicator style={{ marginTop: 12 }} color={colors.primary} />}

      <Pressable style={styles.editBtn} onPress={() => navigation.navigate('EditTask', { id })} disabled={busy}>
        <Text style={styles.btnText}>Edit Task</Text>
      </Pressable>
      <Pressable style={styles.deleteBtn} onPress={confirmDelete} disabled={busy}>
        <Text style={styles.btnText}>Delete Task</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retry: { marginTop: 14, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  badge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 18 },
  value: { fontSize: 15, color: colors.text, marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  error: { color: colors.danger, marginTop: 12 },
  editBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  deleteBtn: { backgroundColor: colors.danger, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
