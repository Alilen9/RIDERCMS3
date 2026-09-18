/**
 * Encodes the admin's current working screen into the /admin/dashboard URL
 * query string so the existing lastVisitedPath mechanism (pathname + search)
 * can restore exactly where the admin was after a re-login or reload.
 *
 * This matters for payment flows: an admin may trigger an M-Pesa prefer or a
 * manual withdrawal, switch to another app to call the rider, and come back —
 * the retry/waiting screen should still be there waiting.
 */

export interface AdminWorkspaceParams {
  section?: string;
  sessionId?: string;
  retry?: '1';
  booth?: string;
  slot?: string;
  paymentSessionId?: string;
}

const toParam = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? undefined : String(value);

export const parseAdminWorkspace = (search: string): AdminWorkspaceParams => {
  const params = new URLSearchParams(search);

  return {
    section: toParam(params.get('section')),
    sessionId: toParam(params.get('sessionId')),
    retry: params.get('retry') === '1' ? '1' : undefined,
    booth: toParam(params.get('booth')),
    slot: toParam(params.get('slot')),
    paymentSessionId: toParam(params.get('paymentSessionId')),
  };
};

export const buildAdminDashboardPath = (params: AdminWorkspaceParams): string => {
  const search = new URLSearchParams();

  if (params.section) search.set('section', params.section);
  if (params.sessionId) search.set('sessionId', params.sessionId);
  if (params.retry === '1') search.set('retry', '1');
  if (params.booth) search.set('booth', params.booth);
  if (params.slot) search.set('slot', params.slot);
  if (params.paymentSessionId) search.set('paymentSessionId', params.paymentSessionId);

  const qs = search.toString();
  return qs ? `/admin/dashboard?${qs}` : '/admin/dashboard';
};