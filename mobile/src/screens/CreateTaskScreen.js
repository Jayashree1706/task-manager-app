import React, { useState } from 'react';
import { Alert } from 'react-native';
import TaskForm from '../components/TaskForm';
import { createTask, getErrorMessage } from '../api';

export default function CreateTaskScreen({ navigation }) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      await createTask(values);
      Alert.alert('Success', 'Task created');
      navigation.goBack();
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return <TaskForm submitLabel="Create Task" onSubmit={onSubmit} submitting={submitting} serverError={serverError} />;
}
