export function migrateSettings(
  state: Record<string, unknown>,
  previousVersion: string,
): Record<string, unknown> {
  return {
    ...state,
    activeDays: state.activeDays ?? [],
    mosqueSelectedOn: state.mosqueSelectedOn ?? null,
    reviewRequestedAt: state.reviewRequestedAt ?? (state.reviewRequested ? Date.now() : null),
    reviewRequestedVersion: state.reviewRequestedVersion ?? null,
    analyticsEnabled: state.analyticsEnabled ?? true,
    lastSeenWhatsNew: state.lastSeenWhatsNew ?? previousVersion,
    seenSurveys: state.seenSurveys ?? [],
    supportTicketId: state.supportTicketId ?? null,
    supportSessionId: state.supportSessionId ?? null,
  };
}
