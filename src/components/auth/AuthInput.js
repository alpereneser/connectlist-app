import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Spacing } from '../../constants';

const AuthInput = ({
  placeholder = '',
  value = '',
  onChangeText = () => {},
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error = '',
  icon = null,
  editable = true,
  maxLength = null,
  onFocus = () => {},
  onBlur = () => {},
  testID = '',
  accessibilityLabel = '',
  returnKeyType = 'done',
  onSubmitEditing = () => {},
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const hasError = error && error.length > 0;
  const showPasswordToggle = secureTextEntry;
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={20}
            color={
              hasError
                ? Colors.error
                : isFocused
                  ? Colors.orange
                  : Colors.textSecondary
            }
            style={styles.icon}
          />
        )}

        <TextInput
          style={[
            styles.textInput,
            icon && styles.textInputWithIcon,
            showPasswordToggle && styles.textInputWithToggle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={actualSecureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
          accessibilityLabel={accessibilityLabel || placeholder}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCorrect={false}
          spellCheck={false}
        />

        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
          >
            <Feather
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {hasError && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.medium,
    minHeight: 56,
  },
  inputContainerFocused: {
    borderColor: Colors.orange,
    backgroundColor: Colors.background,
  },
  inputContainerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.background,
  },
  icon: {
    marginRight: Spacing.small,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.regular,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: Spacing.medium,
  },
  textInputWithIcon: {
    marginLeft: 0,
  },
  textInputWithToggle: {
    marginRight: Spacing.small,
  },
  passwordToggle: {
    padding: Spacing.tiny,
  },
  errorText: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Colors.error,
    marginTop: Spacing.tiny,
    marginLeft: Spacing.small,
  },
});

export default AuthInput;
