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
import type { LearningTrack, Lesson, LessonProgress } from '../../../shared/api/index.ts';
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
  const [completionError, setCompletionError] = useState<string | null>(null);

  const selectedTrack = learning.tracks.find((track) => track.id === selectedTrackId) ?? null;
  const lessons = selectedTrackId ? (learning.lessonsByTrack[selectedTrackId] ?? null) : null;
  const selectedLesson = lessons?.find((lesson) => lesson.id === selectedLessonId) ?? null;

  if (selectedTrack && selectedLesson && lessons) {
    const progress = learning.progressByLessonId.get(selectedLesson.id);
    const completed = progress?.status === 'completed';
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
    const nextLesson = lessons[lessonIndex + 1] ?? null;
    const completeLesson = async () => {
      setCompleting(true);
      setCompletionError(null);
      try {
        await learning.markLessonComplete(selectedLesson.id);
      } catch {
        setCompletionError('Não foi possível salvar seu progresso. Tente novamente.');
      } finally {
        setCompleting(false);
      }
    };

    return (
      <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
        <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-5">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityLabel="Voltar para a trilha"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
              onPress={() => {
                setCompletionError(null);
                setSelectedLessonId(null);
              }}
            >
              <Lucide color={theme.colors.text} name="chevron-left" size={20} />
            </Pressable>
            <View className="flex-1 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-label text-[10px] uppercase tracking-[1.5px] text-accent">
                  {selectedTrack.title}
                </Text>
                <Text className="font-label text-[10px] text-muted">
                  {lessonIndex + 1} / {lessons.length}
                </Text>
              </View>
              <ProgressBar percent={((lessonIndex + 1) / lessons.length) * 100} />
            </View>
          </View>

          <View className="gap-4 rounded-panel border border-border bg-surface p-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-2">
              <Lucide
                color={completed ? theme.colors.info : theme.colors.accent}
                name={completed ? 'check' : 'sparkles'}
                size={24}
              />
            </View>
            <View className="gap-2">
              <Text className="font-label text-[10px] uppercase tracking-[2px] text-accent">
                {completed ? 'Lição concluída' : 'Sua próxima descoberta'}
              </Text>
              <Text accessibilityRole="header" className="font-display text-2xl text-ink">
                {selectedLesson.title}
              </Text>
            </View>
            <View className="h-px bg-border" />
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Lucide color={theme.colors.accent} name="lightbulb" size={16} />
                <Text className="font-label text-sm text-ink">O que você vai aprender</Text>
              </View>
              <Text className="font-body text-sm leading-6 text-muted">
                {selectedLesson.content}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: completing, disabled: completing || completed }}
            className={`h-12 flex-row items-center justify-center gap-2 rounded-pill active:opacity-80 ${
              completed ? 'border border-border bg-surface' : 'bg-brand'
            }`}
            disabled={completing || completed}
            onPress={() => void completeLesson()}
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

          {completionError ? (
            <Text accessibilityRole="alert" className="text-center font-body text-sm text-event">
              {completionError}
            </Text>
          ) : null}

          {nextLesson ? (
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-row items-center justify-center gap-2 rounded-pill bg-brand active:opacity-80"
              onPress={() => {
                setCompletionError(null);
                setSelectedLessonId(nextLesson.id);
              }}
            >
              <Text className="font-label text-xs text-ink">
                {completed ? 'Continuar jornada' : 'Próxima aula'}
              </Text>
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
        <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-5">
          <Pressable
            accessibilityLabel="Voltar para as trilhas"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={() => setSelectedTrackId(null)}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={20} />
          </Pressable>
          <View className="gap-2">
            <Text className="font-label text-[10px] uppercase tracking-[2px] text-accent">
              Sua jornada
            </Text>
            <Text accessibilityRole="header" className="font-display text-3xl text-ink">
              {selectedTrack.title}
            </Text>
            <Text className="font-body text-sm leading-6 text-muted">
              {selectedTrack.description}
            </Text>
          </View>

          {stats && stats.total > 0 ? (
            <View className="gap-4 rounded-panel border border-border bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="font-label text-[10px] uppercase tracking-[1.5px] text-muted">
                    Seu progresso
                  </Text>
                  <Text className="font-display text-lg text-ink">
                    {stats.completed} de {stats.total} aulas
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-brand bg-surface-2">
                  <Text className="font-label text-xs text-accent">{stats.percent}%</Text>
                </View>
              </View>
              <ProgressBar percent={stats.percent} />
              {stats.nextLesson ? (
                <Pressable
                  accessibilityRole="button"
                  className="flex-row items-center justify-between rounded-control bg-surface-2 px-4 py-3 active:opacity-80"
                  onPress={() => setSelectedLessonId(stats.nextLesson?.id ?? null)}
                >
                  <View className="flex-1 gap-1">
                    <Text className="font-label text-[10px] uppercase tracking-[1px] text-accent">
                      Próxima recomendada
                    </Text>
                    <Text className="font-label text-sm text-ink" numberOfLines={1}>
                      {stats.nextLesson.title}
                    </Text>
                  </View>
                  <Lucide color={theme.colors.accent} name="play" size={18} />
                </Pressable>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Lucide color={theme.colors.info} name="circle-check" size={16} />
                  <Text className="font-body text-sm text-info">Trilha concluída. Muito bem!</Text>
                </View>
              )}
            </View>
          ) : null}

          {learning.lessonsLoading === selectedTrack.id ? (
            <View className="items-center gap-3 rounded-card bg-surface p-8">
              <ActivityIndicator color={theme.colors.primary} />
              <Text className="font-body text-sm text-muted">Carregando aulas...</Text>
            </View>
          ) : lessons && lessons.length > 0 ? (
            <View className="gap-3">
              <View className="gap-1 pb-1">
                <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                  Caminho de aprendizado
                </Text>
                <Text className="font-body text-xs text-muted">
                  Toque em uma aula para explorar o conteúdo.
                </Text>
              </View>
              <View className="gap-2">
                {lessons.map((lesson, index) => (
                  <LessonRow
                    key={lesson.id}
                    index={index}
                    isNext={stats?.nextLesson?.id === lesson.id}
                    isLast={index === lessons.length - 1}
                    lesson={lesson}
                    onPress={() => setSelectedLessonId(lesson.id)}
                    progress={learning.progressByLessonId.get(lesson.id)}
                  />
                ))}
              </View>
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
  const totalLessons = Array.from(learning.trackStats.values()).reduce(
    (total, stats) => total + stats.total,
    0,
  );
  const completedLessons = Array.from(learning.trackStats.values()).reduce(
    (total, stats) => total + stats.completed,
    0,
  );
  const journeyProgress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <ImageBackground resizeMode="cover" source={backgroundImage}>
          <View className="gap-2 bg-canvas/50 px-5 pb-8 pt-6">
            <Text className="font-label text-[11px] uppercase tracking-[2.5px] text-accent">
              APRENDA EXPLORANDO O UNIVERSO
            </Text>
            <Text accessibilityRole="header" className="font-display text-[32px] text-ink">
              Descubra o céu,{'\n'}uma aula por vez.
            </Text>
            <Text className="font-body text-sm leading-5 text-ink">
              Trilhas curtas para aprender no seu ritmo.
            </Text>
          </View>
        </ImageBackground>

        <View className="gap-6 px-5 pt-6">
          {!learning.loading && totalLessons > 0 ? (
            <View className="gap-4 rounded-panel border border-border bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-surface-2">
                    <Lucide color={theme.colors.accent} name="sparkles" size={20} />
                  </View>
                  <View className="gap-1">
                    <Text className="font-label text-sm text-ink">Sua jornada</Text>
                    <Text className="font-body text-xs text-muted">
                      {completedLessons} de {totalLessons} aulas concluídas
                    </Text>
                  </View>
                </View>
                <Text className="font-label text-sm text-accent">{journeyProgress}%</Text>
              </View>
              <ProgressBar percent={journeyProgress} />
            </View>
          ) : null}

          {continueTrack && continueStats ? (
            <View className="gap-3">
              <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                Seu próximo passo
              </Text>
              <Pressable
                accessibilityLabel={`Continuar trilha ${continueTrack.title}`}
                accessibilityRole="button"
                className="flex-row items-center gap-4 rounded-panel border border-brand bg-surface p-4 active:opacity-80"
                onPress={() => setSelectedTrackId(continueTrack.id)}
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-2">
                  <Lucide color={theme.colors.accent} name="play" size={22} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-label text-sm text-ink" numberOfLines={1}>
                    {continueTrack.title}
                  </Text>
                  <Text className="font-body text-xs text-accent">
                    {continueStats.nextLesson?.title ?? 'Continuar trilha'}
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
              <View className="gap-1">
                <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                  Escolha sua trilha
                </Text>
                <Text className="font-body text-xs text-muted">
                  Cada etapa aproxima você do céu.
                </Text>
              </View>
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
  const completed = !!stats && stats.total > 0 && stats.completed === stats.total;

  return (
    <Pressable
      accessibilityLabel={`Abrir trilha ${track.title}`}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-panel border border-border bg-surface p-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-2">
        <Lucide
          color={completed ? theme.colors.info : theme.colors.accent}
          name={completed ? 'check' : 'graduation-cap'}
          size={20}
        />
      </View>
      <View className="flex-1 gap-2">
        <Text className="font-label text-sm text-ink">{track.title}</Text>
        <Text className="font-body text-xs leading-5 text-muted" numberOfLines={2}>
          {track.description}
        </Text>
        {stats && stats.total > 0 ? (
          <View className="gap-2 pt-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-xs text-muted">
                {completed
                  ? 'Trilha concluída'
                  : started
                    ? `${stats.completed} de ${stats.total} aulas`
                    : `${stats.total} aulas para explorar`}
              </Text>
              {started ? (
                <Text className="font-label text-[10px] text-accent">{stats.percent}%</Text>
              ) : null}
            </View>
            <ProgressBar percent={stats.percent} />
          </View>
        ) : (
          <Text className="font-body text-xs text-accent">Comece a explorar</Text>
        )}
      </View>
      <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
    </Pressable>
  );
}

function LessonRow({
  lesson,
  index,
  isNext,
  isLast,
  progress,
  onPress,
}: {
  lesson: Lesson;
  index: number;
  isNext: boolean;
  isLast: boolean;
  progress: LessonProgress | undefined;
  onPress(): void;
}) {
  const completed = progress?.status === 'completed';

  return (
    <View className="min-h-[76px] flex-row gap-3">
      <View className="w-10 items-center">
        <View
          className={`z-10 h-10 w-10 items-center justify-center rounded-full border-2 ${
            completed
              ? 'border-info bg-surface-2'
              : isNext
                ? 'border-brand bg-brand'
                : 'border-border bg-surface'
          }`}
        >
          {completed ? (
            <Lucide color={theme.colors.info} name="check" size={18} />
          ) : isNext ? (
            <Lucide color={theme.colors.text} name="play" size={16} />
          ) : (
            <Text className="font-label text-xs text-muted">{index + 1}</Text>
          )}
        </View>
        {!isLast ? (
          <View className={`w-1 flex-1 ${completed ? 'bg-info/40' : 'bg-surface-2'}`} />
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={`Abrir aula ${index + 1}: ${lesson.title}${completed ? ', concluída' : isNext ? ', próxima recomendada' : ''}`}
        accessibilityRole="button"
        className={`mb-3 flex-1 flex-row items-center gap-3 rounded-panel border px-4 py-4 active:opacity-80 ${
          isNext ? 'border-brand bg-surface' : 'border-border bg-surface'
        }`}
        onPress={onPress}
      >
        <View className="flex-1 gap-1">
          <Text
            className={`font-label text-[10px] uppercase tracking-[1px] ${
              completed ? 'text-info' : isNext ? 'text-accent' : 'text-muted'
            }`}
          >
            {completed ? 'Concluída' : isNext ? 'Próxima recomendada' : `Aula ${index + 1}`}
          </Text>
          <Text className="font-label text-sm text-ink">{lesson.title}</Text>
        </View>
        <Lucide
          color={isNext ? theme.colors.accent : theme.colors.muted}
          name="chevron-right"
          size={18}
        />
      </Pressable>
    </View>
  );
}
