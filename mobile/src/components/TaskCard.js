import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function TaskCard({ task, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
      {!!task.description && (
        <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>
      )}
      <View style={styles.row}>
        <Text style={[styles.badge, { backgroundColor: colors[task.status] }]}>{task.status}</Text>
        <Text style={[styles.badge, { backgroundColor: colors[task.priority] }]}>{task.priority}</Text>
        {!!task.due_date && <Text style={styles.due}>Due {task.due_date}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.muted, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  badge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 6,
  },
  due: { fontSize: 12, color: colors.muted, marginLeft: 4 },
});
