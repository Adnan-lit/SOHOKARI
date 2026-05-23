import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors }   from '@theme/colors';

interface Props extends TextInputProps {
  label:       string;
  error?:      string;
  iconName?:   React.ComponentProps<typeof Ionicons>['name'];
  isPassword?: boolean;
}

export default function FormInput({
  label, error, iconName, isPassword, style, ...rest
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : styles.inputNormal]}>
        {iconName && (
          <Ionicons name={iconName} size={18} color={Colors.textMuted} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  inputRow:   {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10,
    backgroundColor: Colors.surface, paddingHorizontal: 12,
  },
  inputNormal:{ borderColor: Colors.border },
  inputError: { borderColor: Colors.error },
  icon:       { marginRight: 8 },
  input:      { flex: 1, height: 48, fontSize: 15, color: Colors.text },
  eyeBtn:     { padding: 4 },
  errorText:  { fontSize: 12, color: Colors.error, marginTop: 4 },
});