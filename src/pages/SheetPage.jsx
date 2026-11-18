import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import QuestionSearch from "../components/QuestionSearch";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";
import EditorActionPanel from "../components/EditorActionPanel";
import ConfirmationModal from "../components/ConfirmationModal";
import TopicReminderAlarmPanel from "../components/TopicReminderAlarmPanel";
import { calculateSheetProgress } from "../services/progress";
import { getSheetEditorRoute, navigateTo, ROUTES } from "../services/routes";
import { getNotificationPermissionState, requestNotificationPermission } from "../services/notifications";
import { createAlarmNotification } from "../api/notificationApi";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import SurfaceCard from "../components/ui/SurfaceCard";
import Skeleton, { SkeletonText } from "../components/ui/Skeleton";
import DifficultyDistributionWidget from "../components/DifficultyDistributionWidget";
import TopicDistributionChart from "../components/TopicDistributionChart";
import SheetHeader from "../components/SheetHeader";
import SheetMetadataDrawer from "../components/SheetMetadataDrawer";
import { DEFAULT_DIFFICULTY_CATEGORIES } from "../services/difficultyCategories";
import { createDifficultyCategory, listDifficultyCategories } from "../api/difficultyCategoryApi";

const getLimitExhaustMessage = (limitWarning) => {
  if (!limitWarning || !limitWarning.startsWith("Limit reached:")) return null;
  if (limitWarning.includes("copy")) {
    return "This sheet is larger than the current workspace safety limit, so it cannot be copied right now.";
  }
  if (limitWarning.includes("edit-lock")) {
    return "This sheet is larger than the current workspace safety limit, so editing is paused.";
  }
  if (limitWarning.includes("question")) {
    return "This sheet has reached the question safety limit.";
  }
  if (limitWarning.includes("topic")) {
    return "This sheet has reached the topic safety limit.";
  }
  if (limitWarning.includes("subtopic")) {
    return "This sheet has reached the subtopic safety limit.";
  }
  if (limitWarning.includes("sheet")) {
    return "Your workspace has reached the sheet safety limit.";
  }
  return "A workspace safety limit was reached.";
};

function SheetPage({ sheetId, onOpenImport, onOpenExport, theme, onThemeChange }) {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [questionFilterState, setQuestionFilterState] = useState({
    status: "all",
    revision: "all",
    difficulty: "all",
    tagId: "all",
  });
  const [questionSortBy, setQuestionSortBy] = useState("topic_order");
  const [activeDialog, setActiveDialog] = useState(null);
  const [sortBy, setSortBy] = useState("edited");
  const [typeFilter, setTypeFilter] = useState("all");
  const [, setNowTick] = useState(0);
  const [topicSchedulerState, setTopicSchedulerState] = useState({ open: false, mode: "reminder" });
  const [sheetMetadataDrawerOpen, setSheetMetadataDrawerOpen] = useState(false);
  const [scheduledTopicAlerts, setScheduledTopicAlerts] = useState([]);
  const [difficultyCategories, setDifficultyCategories] = useState(DEFAULT_DIFFICULTY_CATEGORIES);

  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const addTopic = useSheetStore((state) => state.addTopic);
  const loadSheetById = useSheetStore((state) => state.loadSheetById);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const sheets = useSheetStore((state) => state.sheets);
  const saveCurrentSheetDraft = useSheetStore((state) => state.saveCurrentSheetDraft);
  const updateSheetMetadata = useSheetStore((state) => state.updateSheetMetadata);
  const setSheetVisibility = useSheetStore((state) => state.setSheetVisibility);
  const setSheetArchived = useSheetStore((state) => state.setSheetArchived);
  const setSheetShareProgress = useSheetStore((state) => state.setSheetShareProgress);
  const duplicateSheetById = useSheetStore((state) => state.duplicateSheetById);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const deleteSheet = useSheetStore((state) => state.deleteSheet);
  const discardUnsavedChanges = useSheetStore((state) => state.discardUnsavedChanges);
  const isLoading = useSheetStore((state) => state.isLoading);
  const isSaving = useSheetStore((state) => state.isSaving);
  const loadError = useSheetStore((state) => state.loadError);
  const saveError = useSheetStore((state) => state.saveError);
  const hasPendingChanges = useSheetStore((state) => state.hasPendingChanges);
  const lastSavedAt = useSheetStore((state) => state.lastSavedAt);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const logoUrl = useSheetStore((state) => state.logoUrl);
  const sheetUrlValue = useSheetStore((state) => state.sheetUrl);
  const topics = useSheetStore((state) => state.topics);
  const topicTags = useSheetStore((state) => state.topicTags);
  const limitWarning = useSheetStore((state) => state.limitWarning);
  const clearLimitWarning = useSheetStore((state) => state.clearLimitWarning);
  const undo = useSheetStore((state) => state.undo);
  const redo = useSheetStore((state) => state.redo);
  const canUndo = useSheetStore((state) => state.past.length > 0);
  const canRedo = useSheetStore((state) => state.future.length > 0);
  const suppressHashGuardRef = useRef(false);
  const previousHashRef = useRef(window.location.hash);
  const announcedTopicAlertsRef = useRef(new Set());
  const focusProblemId = new URLSearchParams(window.location.search).get("problemId");
  const topicAlertStorageKey = `iqms-topic-alerts:${sheetId || "sheet-index"}`;
  const isSessionExpiredError = (error) => error?.status === 401;

  useEffect(() => {
    if (!sheetId || !currentUser?.token) return;
    loadSheetById(currentUser.token, sheetId);
  }, [sheetId, loadSheetById, currentUser?.token]);

  useEffect(() => {
    if (!currentUser?.token || !sheetId) return;
    listDifficultyCategories(currentUser.token)
      .then((response) => {
        if (Array.isArray(response?.categories) && response.categories.length > 0) {
          setDifficultyCategories(response.categories);
        }
      })
      .catch(() => {
        setDifficultyCategories(DEFAULT_DIFFICULTY_CATEGORIES);
      });
  }, [currentUser?.token, sheetId]);

  useEffect(() => {
    if (sheetId || !currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [sheetId, currentUser?.token, loadSheets]);

  useEffect(() => {
    previousHashRef.current = window.location.hash;
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTick((tick) => tick + 1);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [lastSavedAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(topicAlertStorageKey);
    if (!raw) {
      setScheduledTopicAlerts([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setScheduledTopicAlerts([]);
        return;
      }
      setScheduledTopicAlerts(parsed);
    } catch {
      setScheduledTopicAlerts([]);
    }
  }, [topicAlertStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(topicAlertStorageKey, JSON.stringify(scheduledTopicAlerts));
  }, [scheduledTopicAlerts, topicAlertStorageKey]);

  useEffect(() => {
    const onOpenTopicScheduler = (event) => {
      const mode = event?.detail?.mode === "alarm" ? "alarm" : "reminder";
      if (!sheetId) return;
      setTopicSchedulerState({ open: true, mode });
    };

    window.addEventListener("iqms-open-topic-timer", onOpenTopicScheduler);
    return () => window.removeEventListener("iqms-open-topic-timer", onOpenTopicScheduler);
  }, [sheetId]);

  useEffect(() => {
    const tick = () => {
      if (!scheduledTopicAlerts.length) return;
      const now = Date.now();
      const dueAlerts = scheduledTopicAlerts.filter((item) => {
        const scheduledAt = new Date(item.scheduledFor).getTime();
        return !Number.isNaN(scheduledAt) && scheduledAt <= now && !item.completed && !item.triggeredAt;
      });

      if (!dueAlerts.length) return;

      dueAlerts.forEach((item) => {
        if (announcedTopicAlertsRef.current.has(item.id)) return;
        announcedTopicAlertsRef.current.add(item.id);
        if ("Notification" in window && Notification.permission === "granted") {
          const title = item.mode === "alarm" ? `Alarm: ${item.topicTitle}` : `Reminder: ${item.topicTitle}`;
          const body = `Time for topic "${item.topicTitle}" in your sheet.`;
          new Notification(title, { body, tag: `topic-${item.id}` });
        } else {
          setActiveDialog({
            key: `topic-alert-${item.id}`,
            title: item.mode === "alarm" ? "Alarm is due" : "Reminder is due",
            message: `Time for topic "${item.topicTitle}" in your sheet.`,
            actions: [{ key: "ok", label: "OK", variant: "neutral", onClick: () => setActiveDialog(null) }],
          });
        }
      });

      setScheduledTopicAlerts((current) =>
        current.map((item) => {
          const scheduledAt = new Date(item.scheduledFor).getTime();
          if (Number.isNaN(scheduledAt) || scheduledAt > now || item.completed || item.triggeredAt) return item;
          return { ...item, triggeredAt: new Date(now).toISOString() };
        })
      );
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [scheduledTopicAlerts]);

  useEffect(() => {
    const limitMessage = getLimitExhaustMessage(limitWarning);
    if (!limitMessage) return;
    if (activeDialog?.key === "plan-limit-exhausted") return;

    setActiveDialog({
      key: "plan-limit-exhausted",
      title: "Workspace safety limit reached",
      message: limitMessage,
      actions: [
        {
          key: "dismiss",
          label: "Dismiss",
          variant: "neutral",
          onClick: () => {
            clearLimitWarning();
            setActiveDialog(null);
          },
        },
      ],
    });
  }, [activeDialog?.key, clearLimitWarning, limitWarning]);

  const closeDialog = useCallback(() => setActiveDialog(null), []);

  const handleSaveChanges = useCallback(async () => {
    if (!currentUser?.token || !sheetId) return false;
    return saveCurrentSheetDraft(currentUser.token);
  }, [currentUser, saveCurrentSheetDraft, sheetId]);

  const handleDiscardChanges = useCallback(() => {
    discardUnsavedChanges();
    closeDialog();
  }, [closeDialog, discardUnsavedChanges]);

  const openDiscardDialog = useCallback(() => {
    setActiveDialog({
      key: "discard",
      title: "Discard unsaved changes?",
      message: "This will remove all edits made since your last successful save.",
      actions: [
        { key: "cancel", label: "Cancel", variant: "neutral", onClick: closeDialog },
        { key: "discard", label: "Discard", variant: "danger", onClick: handleDiscardChanges },
      ],
    });
  }, [closeDialog, handleDiscardChanges]);

  const requestNavigation = useCallback((navigateAction, destinationLabel) => {
    if (!hasPendingChanges) {
      navigateAction();
      return;
    }

    setActiveDialog({
      key: "unsaved-navigation",
      title: "You have unsaved changes",
      message: `Save or discard your edits before you ${destinationLabel}.`,
      actions: [
        { key: "stay", label: "Stay", variant: "neutral", onClick: closeDialog },
        {
          key: "discard",
          label: "Discard & Continue",
          variant: "danger",
          onClick: () => {
            discardUnsavedChanges();
            closeDialog();
            navigateAction();
          },
        },
        {
          key: "save",
          label: "Save & Continue",
          variant: "success",
          onClick: async () => {
            const wasSaved = await handleSaveChanges();
            if (!wasSaved) return;
            closeDialog();
            navigateAction();
          },
        },
      ],
    });
  }, [closeDialog, discardUnsavedChanges, handleSaveChanges, hasPendingChanges]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!hasPendingChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onHashChange = () => {
      if (suppressHashGuardRef.current) {
        suppressHashGuardRef.current = false;
        previousHashRef.current = window.location.hash;
        return;
      }

      const nextHash = window.location.hash;
      if (!hasPendingChanges) {
        previousHashRef.current = nextHash;
        return;
      }

      suppressHashGuardRef.current = true;
      window.location.hash = previousHashRef.current;

      requestNavigation(
        () => {
          suppressHashGuardRef.current = true;
          window.location.hash = nextHash;
          previousHashRef.current = nextHash;
        },
        "leave this page"
      );
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [hasPendingChanges, requestNavigation]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title).then((created) => {
      if (created) setTitle("");
    });
  };

  const saveTopicAlert = async ({ topicId, scheduledFor, mode }) => {
    const topic = topics.find((entry) => entry.id === topicId);
    if (!topic) return;

    if (getNotificationPermissionState() !== "granted") {
      await requestNotificationPermission();
    }

    setScheduledTopicAlerts((current) => [
      ...current,
      {
        id: `topic-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        topicId,
        topicTitle: topic.title || "Untitled Topic",
        scheduledFor: new Date(scheduledFor).toISOString(),
        mode,
        completed: false,
        triggeredAt: null,
      },
    ]);

    if (!currentUser?.token) return;

    try {
      await createAlarmNotification(currentUser.token, {
        title: `${mode === "alarm" ? "Alarm" : "Reminder"}: ${topic.title || "Topic"}`,
        message: `Time for ${topic.title || "topic"} in ${sheetTitle || "your sheet"}.`,
        scheduledFor: new Date(scheduledFor).toISOString(),
        sourceType: "topic",
        sourceId: topicId,
        actionUrl: sheetId ? `/app/${sheetId}` : "/app",
      });
    } catch (error) {
      if (isSessionExpiredError(error)) {
        logout();
        navigateTo(ROUTES.LOGIN);
        return;
      }
      setActiveDialog({
        key: "topic-alert-save-error",
        title: "Could not save reminder",
        message: error?.message || "Could not save reminder right now. Please try again.",
        actions: [{ key: "ok", label: "OK", variant: "neutral", onClick: () => setActiveDialog(null) }],
      });
    }
  };


  const sheetProgressById = useMemo(
    () =>
      Object.fromEntries(
        sheets.map((sheet) => [sheet.id, calculateSheetProgress(sheet)])
      ),
    [sheets]
  );

  const filteredAndSortedSheets = useMemo(
    () =>
      [...sheets]
        .filter((sheet) => {
          if (typeFilter === "all") return true;
          if (typeFilter === "public") return Boolean(sheet.isPublic);
          if (typeFilter === "private") return !sheet.isPublic;
          if (typeFilter === "archived") return Boolean(sheet.isArchived);
          return true;
        })
        .sort((a, b) => {
          if (sortBy === "created") {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          }
          if (sortBy === "progress") {
            return (sheetProgressById[b.id]?.percent || 0) - (sheetProgressById[a.id]?.percent || 0);
          }
          if (sortBy === "type") {
            return Number(Boolean(b.isPublic)) - Number(Boolean(a.isPublic));
          }
          if (sortBy === "questions") {
            return (sheetProgressById[b.id]?.totalQuestions || 0) - (sheetProgressById[a.id]?.totalQuestions || 0);
          }
          if (sortBy === "title") {
            return `${a.title || ""}`.localeCompare(`${b.title || ""}`);
          }
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }),
    [sheetProgressById, sheets, sortBy, typeFilter]
  );

  const handleSheetActionError = useCallback((key, title, error) => {
    setActiveDialog({
      key,
      title,
      message: error?.message || "Please try again in a moment.",
      actions: [{ key: "ok", label: "OK", variant: "neutral", onClick: closeDialog }],
    });
  }, [closeDialog]);

  const handleCreateSheet = useCallback(async () => {
    if (!currentUser?.token) return;
    try {
      const created = await createNewSheet(currentUser.token, "Untitled Sheet");
      if (!created?.id) return;
      navigateTo(getSheetEditorRoute(created, currentUser?.username));
    } catch (error) {
      handleSheetActionError("create-sheet-error", "Could not create sheet", error);
    }
  }, [createNewSheet, currentUser?.token, handleSheetActionError]);

  const openedSheet = useMemo(() => sheets.find((sheet) => sheet.id === sheetId) || null, [sheetId, sheets]);
  const activeSheetProgress = useMemo(() => calculateSheetProgress({ topics }), [topics]);
  const handleCreateCustomDifficulty = useCallback(async ({ name, color }) => {
    if (!currentUser?.token) return null;
    const created = await createDifficultyCategory(currentUser.token, { name, color });
    if (created) {
      setDifficultyCategories((current) => [...current.filter((entry) => entry.type !== "custom" || entry.id !== created.id), created]);
    }
    return created;
  }, [currentUser?.token]);

  const sheetActionButtons = [
    { key: "undo", label: "Undo", onClick: undo, disabled: !canUndo },
    { key: "redo", label: "Redo", onClick: redo, disabled: !canRedo },
    {
      key: "save",
      label: isSaving ? "Saving..." : "Save",
      onClick: () => {
        void handleSaveChanges();
      },
      disabled: !hasPendingChanges || isSaving,
    },
    {
      key: "discard",
      label: "Discard",
      onClick: openDiscardDialog,
      disabled: !hasPendingChanges || isSaving,
    },
    {
      key: "import",
      label: "Import JSON",
      onClick: () => requestNavigation(onOpenImport, "open import"),
      disabled: false,
    },
    {
      key: "export",
      label: "Export",
      onClick: () => requestNavigation(onOpenExport, "open export"),
      disabled: false,
    },
    ...(sheetId
      ? [{ key: "view-only", label: isEditing ? "View Only" : "Edit Sheet", onClick: () => setIsEditing((value) => !value), disabled: false }]
      : []),
  ];

  return (
    <>
      <SeoMeta
        title={sheetId ? `${sheetTitle || "Sheet"} | Create Sheets Workspace` : "Sheets Dashboard | Create Sheets"}
        description={sheetId
          ? `Manage ${sheetTitle || "your sheet"} with question tracking, progress analytics, and revision planning in Create Sheets.`
          : "Manage all your custom sheets from one dashboard. Organize coding, DSA, and interview preparation trackers."}
        path={sheetId ? `/app/${sheetId}` : "/app"}
        noIndex
        keywords={["sheet dashboard", "question tracker", "coding practice tracker"]}
      />
      <AppShell
        title={!sheetId ? "Question Sheet" : null}
        subtitle={!sheetId ? "Manage and organize all your sheets" : null}
        titleActions={null}
        theme={theme}
        onThemeChange={onThemeChange}
        userLabel={currentUser?.fullName || currentUser?.email || "Account"}
        rightPanel={sheetId ? <EditorActionPanel actions={sheetActionButtons} /> : null}
        alert={limitWarning}
        onDismissAlert={clearLimitWarning}
      >
        <SurfaceCard className="sm:p-5">
          {!sheetId ? (
            <div className="space-y-4">
              <div className="panel-elevated flex flex-wrap items-end gap-3 rounded-xl p-3">
                <div className="mr-auto">
                  <button type="button" className="btn-base btn-success px-3 py-2" onClick={handleCreateSheet}>
                    Create Sheet
                  </button>
                </div>
                <label className="text-sm">
                  <span className="mb-1 block text-[var(--text-secondary)]">Sort by</span>
                  <select className="field-base min-w-52" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="edited">Last edited</option>
                    <option value="created">Created date</option>
                    <option value="progress">Progress</option>
                    <option value="type">Type (Public/Private)</option>
                    <option value="questions">Question count</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-[var(--text-secondary)]">Sheet type</span>
                  <select className="field-base min-w-44" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    <option value="all">All sheets</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              {sheets.length === 0 ? (
                <EmptyState
                  title="No sheets yet"
                  description="This account has zero sheets. Create your first sheet to get started."
                  icon=""
                />
              ) : filteredAndSortedSheets.length === 0 ? (
                <EmptyState title="No sheets found" description="Try another filter to see matching sheets." icon="" />
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedSheets.map((sheet) => {
                    const progress = sheetProgressById[sheet.id] || { percent: 0, completedQuestions: 0, totalQuestions: 0 };
                    return (
                      <div
                        key={sheet.id}
                        className="panel-elevated flex cursor-pointer items-start justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-[var(--surface-muted)]"
                        role="link"
                        tabIndex={0}
                        onClick={() => {
                          navigateTo(getSheetEditorRoute(sheet, currentUser?.username));
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigateTo(getSheetEditorRoute(sheet, currentUser?.username));
                          }
                        }}
                      >
                        <div className="w-full max-w-lg space-y-2">
                          <a className="block text-base font-semibold text-[var(--text-primary)] hover:underline" href={getSheetEditorRoute(sheet, currentUser?.username)}>
                            {sheet.title || "Untitled Sheet"}
                          </a>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {sheet.isPublic ? "Public" : "Private"}
                            {sheet.isArchived ? " • Archived" : ""}
                            {sheet.shareProgress ? " • Shared progress on" : " • Shared progress off"} • Progress {progress.percent}% ({progress.completedQuestions}/{progress.totalQuestions})
                          </p>
                          <ProgressBar percent={progress.percent} tone={progress.percent > 70 ? "success" : "warning"} />
                          <p className="text-xs text-[var(--text-secondary)]">
                            <a className="hover:underline" href={getSheetEditorRoute(sheet, currentUser?.username)}>{sheet.description?.trim() || "No description"}</a>
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Created: {sheet.createdAt ? new Date(sheet.createdAt).toLocaleDateString() : "Unknown"} •
                            Updated: {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleString() : "Unknown"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              <SheetHeader
                title={sheetTitle || openedSheet?.title || "Untitled Sheet"}
                description={openedSheet?.description || ""}
                logoUrl={logoUrl || openedSheet?.logoUrl || ""}
                onEditMetadata={isEditing ? (() => setSheetMetadataDrawerOpen(true)) : undefined}
                completedCount={activeSheetProgress.completedQuestions}
                totalCount={activeSheetProgress.totalQuestions}
                updatedAt={openedSheet?.updatedAt || lastSavedAt}
                metadata={[
                  { label: "Visibility", value: openedSheet?.isPublic ? "Public" : "Private" },
                  { label: "Mode", value: isEditing ? "Edit" : "View only" },
                ]}
              />

              {isEditing && (
            <>
              <AddTopicForm title={title} onTitleChange={(event) => setTitle(event.target.value)} onAdd={handleAdd} />
              <QuestionSearch
                value={searchQuery}
                onChange={setSearchQuery}
                filterState={questionFilterState}
                onFilterChange={setQuestionFilterState}
                sortBy={questionSortBy}
                onSortChange={setQuestionSortBy}
                availableTags={topicTags}
              />
            </>
          )}

          <main>
            <div className="grid gap-4 xl:grid-cols-2">
              <TopicDistributionChart topics={topics} topicTags={topicTags} />
              <DifficultyDistributionWidget topics={topics} categories={difficultyCategories} />
            </div>
            {isLoading ? (
              <div className="mb-4 space-y-3">
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="panel-muted space-y-3 rounded-xl p-3">
                    <Skeleton className="h-5 w-44" rounded="rounded-md" />
                    <Skeleton className="h-40 w-full" rounded="rounded-lg" />
                  </div>
                  <div className="panel-muted space-y-3 rounded-xl p-3">
                    <Skeleton className="h-5 w-52" rounded="rounded-md" />
                    <Skeleton className="h-40 w-full" rounded="rounded-lg" />
                  </div>
                </div>
                <div className="panel-muted space-y-3 rounded-xl p-3">
                  <Skeleton className="h-9 w-full" rounded="rounded-lg" />
                  <SkeletonText lines={6} />
                </div>
              </div>
            ) : null}
            {!isLoading && (loadError || saveError) ? (
              <p className="mb-4 text-sm text-[var(--text-secondary)]">{loadError || saveError}</p>
            ) : null}
            <TopicList
              isEditing={isEditing}
              searchQuery={searchQuery}
              filters={questionFilterState}
              sortBy={questionSortBy}
              allowProgressToggle
              focusProblemId={focusProblemId}
              difficultyCategories={difficultyCategories}
              onCreateCustomDifficulty={handleCreateCustomDifficulty}
              topicTags={topicTags}
            />
          </main>
            </>
          )}
        </SurfaceCard>
      </AppShell>

      <SheetMetadataDrawer
        open={sheetMetadataDrawerOpen}
        initialTitle={openedSheet?.title || "Untitled Sheet"}
        initialDescription={openedSheet?.description || ""}
        initialLogoUrl={logoUrl || openedSheet?.logoUrl || ""}
        initialSheetUrl={sheetUrlValue || openedSheet?.sheetUrl || ""}
        isPublic={openedSheet?.isPublic}
        isArchived={openedSheet?.isArchived}
        shareProgress={openedSheet?.shareProgress}
        onClose={() => setSheetMetadataDrawerOpen(false)}
        onSave={async ({ title, description, logoUrl: nextLogoUrl, sheetUrl: nextSheetUrl }) => {
          if (!openedSheet || !currentUser?.token) return;
          await updateSheetMetadata(currentUser.token, openedSheet.id, { title, description, logoUrl: nextLogoUrl, sheetUrl: nextSheetUrl });
          setSheetMetadataDrawerOpen(false);
        }}
        onToggleVisibility={async () => {
          if (!openedSheet || !currentUser?.token) return;
          try {
            await setSheetVisibility(currentUser.token, openedSheet.id, !openedSheet.isPublic);
          } catch (error) {
            handleSheetActionError("visibility-error", "Could not update visibility", error);
          }
        }}
        onToggleArchive={async () => {
          if (!openedSheet || !currentUser?.token) return;
          try {
            await setSheetArchived(currentUser.token, openedSheet.id, !openedSheet.isArchived);
          } catch (error) {
            handleSheetActionError("archive-error", "Could not update archive state", error);
          }
        }}
        onToggleShareProgress={async () => {
          if (!openedSheet || !currentUser?.token) return;
          try {
            await setSheetShareProgress(currentUser.token, openedSheet.id, !openedSheet.shareProgress);
          } catch (error) {
            handleSheetActionError("share-progress-error", "Could not update shared progress", error);
          }
        }}
        onDelete={async () => {
          if (!openedSheet || !currentUser?.token) return;
          if (!window.confirm("Are you sure to delete this sheet?")) return;
          await deleteSheet(currentUser.token, openedSheet.id);
          setSheetMetadataDrawerOpen(false);
          navigateTo(ROUTES.APP);
        }}
        onCopy={async () => {
          if (!openedSheet || !currentUser?.token) return;
          const copied = await duplicateSheetById(currentUser.token, openedSheet.id);
          if (!copied) return;
          setSheetMetadataDrawerOpen(false);
          navigateTo(getSheetEditorRoute(copied, currentUser?.username));
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(activeDialog)}
        title={activeDialog?.title}
        message={activeDialog?.message}
        actions={activeDialog?.actions}
        onClose={closeDialog}
        isBusy={isSaving}
      />

      <TopicReminderAlarmPanel
        open={topicSchedulerState.open}
        mode={topicSchedulerState.mode}
        topics={topics}
        scheduledAlerts={scheduledTopicAlerts.filter((item) => {
          if (item.completed) return false;
          const scheduledAt = new Date(item.scheduledFor).getTime();
          return Number.isNaN(scheduledAt) || scheduledAt > Date.now();
        })}
        onModeChange={(mode) => setTopicSchedulerState((current) => ({ ...current, mode }))}
        onSave={saveTopicAlert}
        onDelete={(id) => setScheduledTopicAlerts((current) => current.filter((item) => item.id !== id))}
        onClose={() => setTopicSchedulerState((current) => ({ ...current, open: false }))}
      />
    </>
  );
}

export default SheetPage;
