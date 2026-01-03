export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useParams<T extends Record<string, string>>(): T {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  if (path.includes('/dashboard/orders/') && segments.length === 3) {
    return { orderId: segments[2] } as T;
  }

  return {} as T;
}
