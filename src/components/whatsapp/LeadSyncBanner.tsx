import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  ExternalLink,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface LeadSyncBannerProps {
  isVisible: boolean;
  onClose?: () => void;
}

export function LeadSyncBanner({ isVisible, onClose }: LeadSyncBannerProps) {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('syncing');
  const [leadsCount, setLeadsCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Simular processo de sincronização
      const timer1 = setTimeout(() => {
        setLeadsCount(3);
      }, 1000);

      const timer2 = setTimeout(() => {
        setSyncStatus('synced');
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      <Alert className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
        <div className="flex items-center gap-3">
          {syncStatus === 'syncing' && (
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
          )}
          {syncStatus === 'synced' && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {syncStatus === 'error' && (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          
          <div className="flex-1">
            <AlertDescription className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {syncStatus === 'syncing' && 'Sincronizando leads...'}
                  {syncStatus === 'synced' && 'Leads sincronizados!'}
                  {syncStatus === 'error' && 'Erro na sincronização'}
                </span>
                
                {leadsCount > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {leadsCount} leads
                  </Badge>
                )}
              </div>

              {syncStatus === 'synced' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>WhatsApp</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>CRM Kanban</span>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
              )}

              {syncStatus === 'synced' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('/leads', '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver CRM
                  </Button>
                  
                  {onClose && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClose}
                      className="text-xs"
                    >
                      Fechar
                    </Button>
                  )}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}