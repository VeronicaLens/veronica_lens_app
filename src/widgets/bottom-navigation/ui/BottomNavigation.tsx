import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../../shared/config/index.ts';

export type AuthenticatedPage = 'home' | 'explore' | 'camera' | 'learn' | 'profile';

interface NavigationItem {
  page: AuthenticatedPage;
  label: string;
  icon: LucideIconName;
  enabled: boolean;
}

const items: NavigationItem[] = [
  { page: 'home', label: 'Início', icon: 'house', enabled: true },
  { page: 'explore', label: 'Explorar', icon: 'telescope', enabled: false },
  { page: 'camera', label: 'Câmera', icon: 'camera', enabled: false },
  { page: 'learn', label: 'Aprender', icon: 'book-open', enabled: false },
  { page: 'profile', label: 'Perfil', icon: 'user-round', enabled: true },
];

interface BottomNavigationProps {
  activePage: AuthenticatedPage;
  onNavigate(page: AuthenticatedPage): void;
}

export function BottomNavigation({ activePage, onNavigate }: BottomNavigationProps) {
  return (
    <SafeAreaView edges={['bottom']} className="border-t border-border bg-surface">
      <View accessibilityRole="tablist" className="h-[58px] flex-row px-2">
        {items.map((item) => {
          const active = item.page === activePage;
          const color = active ? theme.colors.accent : theme.colors.muted;
          return (
            <Pressable
              key={item.page}
              accessibilityRole="tab"
              accessibilityState={{ disabled: !item.enabled, selected: active }}
              className={`flex-1 items-center justify-center gap-1 ${item.enabled ? 'active:opacity-70' : 'opacity-55'}`}
              disabled={!item.enabled}
              onPress={() => onNavigate(item.page)}
            >
              <Lucide color={color} name={item.icon} size={19} />
              <Text className={`font-body text-[9px] ${active ? 'text-accent' : 'text-muted'}`}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
