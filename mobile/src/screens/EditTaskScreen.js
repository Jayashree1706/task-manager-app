import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import TaskForm from '../components/TaskForm';
import { fetchTask, getErrorMessage, updateTask } from '../api';
import { colors } from '../theme';

export default function EditTaskScreen({ route, navigation }) {
  const { id } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setTask(await fetchTask(id));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      await updateTask(id, values);
      Alert.alert('Success', 'Task updated');
      navigation.goBack();
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger, textAlign: 'center' }}>{loadError}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <TaskForm
      initial={task}
      submitLabel="Save Changes"
      onSubmit={onSubmit}
      submitting={submitting}
      serverError={serverError}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retry: { marginTop: 14, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
});
