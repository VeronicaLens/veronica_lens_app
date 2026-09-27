import { Lucide } from '@react-native-vector-icons/lucide';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLearning } from '../../../features/learning/index.ts';
import type { LearningTrack, Lesson } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

interface LearnPageProps {
  accessToken: string;
}

export function LearnPage({ accessToken }: LearnPageProps) {
  const learning = useLearning(accessToken);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const selectedTrack = learning.tracks.find((track) => track.id === selectedTrackId) ?? null;
  const lessons = selectedTrackId ? (learning.lessonsByTrack[selectedTrackId] ?? null) : null;
  const selectedLesson = lessons?.find((lesson) => lesson.id === selectedLessonId) ?? null;

  if (selectedTrack && selectedLesson && lessons) {
    const progress = learning.progressByLessonId.get(selectedLesson.id);
    const completed = progress?.status === 'completed';
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
    const nextLesson = lessons[lessonIndex + 1] ?? null;

    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
        <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-5">
          <Pressable
            accessibilityLabel="Voltar para a trilha"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={() => setSelectedLessonId(null)}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={20} />
          </Pressable>
          <View className="gap-2">
            <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
              {selectedTrack.title}
            </Text>
            <Text accessibilityRole="header" className="font-display text-2xl text-ink">
              {selectedLesson.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <Lucide color={theme.colors.muted} name="book-open" size={14} />
              <Text className="font-body text-xs text-muted">
                Aula {lessonIndex + 1} de {lessons.length}
              </Text>
            </View>
          </View>

          <View className="gap-3 rounded-card border border-border bg-surface p-5">
            <View className="flex-row items-center gap-2">
              <Lucide color={theme.colors.accent} name="lightbulb" size={16} />
              <Text className="font-label text-sm text-ink">O que você vai aprender</Text>
            </View>
            <Text className="font-body text-sm leading-6 text-muted">{selectedLesson.content}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: completing, disabled: completing || completed }}
            className={`h-12 flex-row items-center justify-center gap-2 rounded-pill active:opacity-80 ${
              completed ? 'border border-border bg-surface' : 'bg-brand'
            }`}
            disabled={completing || completed}
            onPress={() => {
              setCompleting(true);
              void learning
                .markLessonComplete(selectedLesson.id)
                .finally(() => setCompleting(false));
            }}
          >
            {completing ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <>
                <Lucide
                  color={completed ? theme.colors.info : theme.colors.text}
                  name="check-circle-2"
                  size={16}
                />
                <Text className="font-label text-xs text-ink">
                  {completed ? 'Aula concluída' : 'Marcar como concluída'}
                </Text>
              </>
            )}
          </Pressable>

          {nextLesson ? (
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-row items-center justify-center gap-2 rounded-pill bg-brand active:opacity-80"
              onPress={() => setSelectedLessonId(nextLesson.id)}
            >
              <Text className="font-label text-xs text-ink">Próxima aula</Text>
              <Lucide color={theme.colors.text} name="chevron-right" size={16} />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            className="items-center py-1"
            onPress={() => setSelectedLessonId(null)}
          >
            <Text className="font-label text-xs text-accent">Voltar à trilha</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (selectedTrack) {
    const stats = learning.trackStats.get(selectedTrack.id);

    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
        <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-5">
          <Pressable
            accessibilityLabel="Voltar para as trilhas"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={() => setSelectedTrackId(null)}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={20} />
          </Pressable>
          <View className="gap-2">
            <Text accessibilityRole="header" className="font-display text-2xl text-ink">
              {selectedTrack.title}
            </Text>
            <Text className="font-body text-sm leading-6 text-muted">
              {selectedTrack.description}
            </Text>
          </View>

          {stats && stats.total > 0 ? (
            <View className="gap-3 rounded-card border border-border bg-surface p-4">
              <Text className="font-label text-sm text-ink">
                {stats.completed} de {stats.total} aulas concluídas
              </Text>
              <ProgressBar percent={stats.percent} />
            </View>
          ) : null}

          {learning.lessonsLoading === selectedTrack.id ? (
            <View className="items-center gap-3 rounded-card bg-surface p-8">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="font-body text-sm text-muted">Carregando aulas...</Text>
            </View>
          ) : lessons && lessons.length > 0 ? (
            <View className="gap-3">
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                Ordem recomendada
              </Text>
              {lessons.map((lesson, index) => (
                <LessonRow
                  key={lesson.id}
                  index={index}
                  isNext={stats?.nextLesson?.id === lesson.id}
                  lesson={lesson}
                  onPress={() => setSelectedLessonId(lesson.id)}
                  progress={learning.progressByLessonId.get(lesson.id)}
                />
              ))}
            </View>
          ) : (
            <View className="items-center gap-3 rounded-card border border-border bg-surface p-7">
              <Lucide color={theme.colors.accent} name="book-open" size={28} />
              <Text className="font-body text-sm leading-5 text-muted">
                Nenhuma aula publicada nesta trilha ainda.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const continueTrack = learning.continueTrack;
  const continueStats = continueTrack ? learning.trackStats.get(continueTrack.id) : null;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <ImageBackground resizeMode="cover" source={backgroundImage}>
          <View className="gap-2 bg-canvas/40 px-5 pb-6 pt-6">
            <Text className="font-label text-[11px] uppercase tracking-[3px] text-accent">
              Sua jornada pelo universo
            </Text>
            <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
              Aprender
            </Text>
            <Text className="font-body text-sm leading-5 text-muted">
              Trilhas para entender o céu, no seu ritmo.
            </Text>
          </View>
        </ImageBackground>

        <View className="gap-5 px-5 pt-6">
          {continueTrack && continueStats ? (
            <View className="gap-3">
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                Continuar aprendendo
              </Text>
              <Pressable
                accessibilityLabel={`Continuar trilha ${continueTrack.title}`}
                accessibilityRole="button"
                className="flex-row items-center gap-4 rounded-card border border-border bg-surface p-4 active:opacity-80"
                onPress={() => setSelectedTrackId(continueTrack.id)}
              >
                <View className="h-14 w-14 items-center justify-center rounded-card bg-surface-2">
                  <Lucide color={theme.colors.accent} name="graduation-cap" size={24} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-label text-sm text-ink" numberOfLines={1}>
                    {continueTrack.title}
                  </Text>
                  <Text className="font-body text-xs text-muted">
                    {continueStats.completed} de {continueStats.total} aulas concluídas
                  </Text>
                  <View className="flex-row items-center gap-2 pt-1">
                    <View className="flex-1">
                      <ProgressBar percent={continueStats.percent} />
                    </View>
                    <Text className="font-label text-xs text-muted">{continueStats.percent}%</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          ) : null}

          <View className="gap-3">
            {learning.tracks.length > 0 ? (
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                Suas trilhas
              </Text>
            ) : null}

            {learning.loading ? (
              <View className="items-center gap-3 rounded-card bg-surface p-8">
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="font-body text-sm text-muted">Carregando trilhas...</Text>
              </View>
            ) : learning.error ? (
              <View className="items-center gap-3 rounded-card border border-border bg-surface p-7">
                <Lucide color={theme.colors.event} name="cloud-off" size={28} />
                <Text className="text-center font-body text-sm leading-5 text-muted">
                  {learning.error}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="mt-2 rounded-pill bg-brand px-5 py-3 active:opacity-80"
                  onPress={() => void learning.refresh()}
                >
                  <Text className="font-label text-xs text-ink">Tentar novamente</Text>
                </Pressable>
              </View>
            ) : learning.tracks.length === 0 ? (
              <View className="items-center gap-3 rounded-card border border-border bg-surface p-7">
                <Lucide color={theme.colors.accent} name="graduation-cap" size={28} />
                <Text className="font-display text-lg text-ink">Nenhuma trilha publicada</Text>
                <Text className="text-center font-body text-sm leading-5 text-muted">
                  Volte em breve para novos conteúdos sobre observação do céu.
                </Text>
              </View>
            ) : (
              learning.tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  onPress={() => setSelectedTrackId(track.id)}
                  stats={learning.trackStats.get(track.id) ?? null}
                  track={track}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <View className="h-1.5 rounded-full bg-brand" style={{ width: `${clamped}%` }} />
    </View>
  );
}

function TrackCard({
  track,
  stats,
  onPress,
}: {
  track: LearningTrack;
  stats: { total: number; completed: number; percent: number } | null;
  onPress(): void;
}) {
  const started = !!stats && stats.completed > 0;

  return (
    <Pressable
      accessibilityLabel={`Abrir trilha ${track.title}`}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-card border border-border bg-surface p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
        <Lucide color={theme.colors.accent} name="graduation-cap" size={20} />
      </View>
      <View className="flex-1 gap-2">
        <Text className="font-label text-sm text-ink">{track.title}</Text>
        <Text className="font-body text-xs leading-5 text-muted" numberOfLines={2}>
          {track.description}
        </Text>
        {stats && stats.total > 0 ? (
          <View className="flex-row items-center gap-2 pt-1">
            <Text className="font-body text-xs text-muted">
              {started ? `${stats.completed} de ${stats.total} aulas` : 'Não iniciada'}
            </Text>
            <View className="flex-1">
              <ProgressBar percent={stats.percent} />
            </View>
            <Text className="font-label text-xs text-muted">{stats.percent}%</Text>
          </View>
        ) : null}
      </View>
      <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
    </Pressable>
  );
}

function LessonRow({
  lesson,
  index,
  isNext,
  progress,
  onPress,
}: {
  lesson: Lesson;
  index: number;
  isNext: boolean;
  progress: { status: string } | undefined;
  onPress(): void;
}) {
  const completed = progress?.status === 'completed';

  return (
    <Pressable
      accessibilityLabel={`Abrir aula ${lesson.title}`}
      accessibilityRole="button"
      className={`flex-row items-center gap-3 rounded-card border p-4 active:opacity-80 ${
        isNext ? 'border-brand bg-surface' : 'border-border bg-surface'
      }`}
      onPress={onPress}
    >
      {completed ? (
        <Lucide color={theme.colors.info} name="check-circle-2" size={22} />
      ) : (
        <View
          className={`h-7 w-7 items-center justify-center rounded-full border ${
            isNext ? 'border-brand' : 'border-border'
          }`}
        >
          <Text className={`font-label text-xs ${isNext ? 'text-brand' : 'text-muted'}`}>
            {index + 1}
          </Text>
        </View>
      )}
      <View className="flex-1 gap-1">
        {isNext ? (
          <Text className="font-label text-[10px] uppercase tracking-[1.5px] text-brand">
            Próxima
          </Text>
        ) : null}
        <Text className="font-label text-sm text-ink">{lesson.title}</Text>
      </View>
      <Lucide color={theme.colors.muted} name="chevron-right" size={16} />
    </Pressable>
  );
}
