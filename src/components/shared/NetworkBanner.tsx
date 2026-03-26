import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-[130] px-4 py-2 text-center text-sm font-medium text-white transition-all duration-300 ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      {isOnline
        ? 'Connexion retablie'
        : 'Connexion perdue - certaines fonctionnalites sont indisponibles'}
    </div>
  );
}
