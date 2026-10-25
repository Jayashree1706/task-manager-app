import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PRIORITIES, STATUSES, colors } from '../theme';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function TaskForm({ initial, submitLabel, onSubmit, submitting, serverError }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState(initial?.status || 'Pending');
  const [priority, setPriority] = useState(initial?.priority || 'Medium');
  const [dueDate, setDueDate] = useState(initial?.due_date || '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    else if (title.trim().length > 100) e.title = 'Title must be 100 characters or less';
    if (dueDate && !DATE_RE.test(dueDate)) e.dueDate = 'Use format YYYY-MM-DD (example: 2026-11-05)';
    else if (dueDate && isNaN(new Date(dueDate).getTime())) e.dueDate = 'That date is not valid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
    });
  };

  const Chips = ({ options, value, onChange }) => (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={[styles.chip, value === o && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Submit resume"
        />
        {!!errors.title && <Text style={styles.error}>{errors.title}</Text>}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Write details here"
          multiline
        />

        <Text style={styles.label}>Status</Text>
        <Chips options={STATUSES} value={status} onChange={setStatus} />

        <Text style={styles.label}>Priority</Text>
        <Chips options={PRIORITIES} value={priority} onChange={setPriority} />

        <Text style={styles.label}>Due date (optional)</Text>
        <TextInput
          style={[styles.input, errors.dueDate && styles.inputError]}
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
        {!!errors.dueDate && <Text style={styles.error}>{errors.dueDate}</Text>}

        {!!serverError && <Text style={[styles.error, { marginTop: 12 }]}>{serverError}</Text>}

        <Pressable style={[styles.button, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{submitLabel}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg, flexGrow: 1 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
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
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
