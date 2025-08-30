import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import BottomMenu from './BottomMenu';
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  PlatformConstants,
} from '../constants';

const ScreenLayout = ({
  title,
  logoSource,
  onBackPress,
  leftIconName = 'arrow-left',
  rightIconName,
  onRightPress,
  filters,
  activeFilter,
  onFilterChange,
  children,
  showBottomMenu = false,
  onTabPress,
  activeTab,
  badges = {},
  statusBarStyle = 'dark-content',
  containerStyle,
  headerHidden = false,
}) => {
  const hasHeader = !headerHidden && (title || onBackPress || rightIconName);
  const hasFilters = Array.isArray(filters) && filters.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={Colors.background}
      />

      {hasHeader && (
        <View style={styles.header}>
          {onBackPress ? (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Feather
                name={leftIconName}
                size={20}
                color={Colors.iconPrimary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton} />
          )}

          {logoSource ? (
            <Image
              source={logoSource}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ) : title ? (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.headerTitlePlaceholder} />
          )}

          {rightIconName && onRightPress ? (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Feather
                name={rightIconName}
                size={20}
                color={Colors.iconPrimary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>
      )}

      {hasFilters && (
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            data={filters}
            keyExtractor={item => String(item)}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                key={String(item)}
                style={[
                  styles.filterTab,
                  activeFilter === item && styles.activeFilterTab,
                  index === 0 && styles.firstFilter,
                ]}
                onPress={() => onFilterChange && onFilterChange(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === item && styles.activeFilterText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View style={[styles.content, containerStyle]}>{children}</View>

      {showBottomMenu && (
        <BottomMenu
          onTabPress={onTabPress}
          activeTab={activeTab}
          badges={badges}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: PlatformConstants.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.h4,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  headerLogo: {
    flex: 1,
    height: 24,
    maxWidth: 115,
  },
  headerTitlePlaceholder: {
    flex: 1,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContent: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  filterTab: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    marginRight: Spacing.small,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  activeFilterTab: {
    backgroundColor: Colors.orange,
  },
  filterText: {
    fontSize: FontSize.regular,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.white,
    fontFamily: FontFamily.semiBold,
  },
  firstFilter: {
    marginLeft: 0,
  },
  content: {
    flex: 1,
  },
});

export default ScreenLayout;
