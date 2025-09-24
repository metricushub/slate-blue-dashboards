import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MccResolution {
  success: boolean;
  resolvedLoginCustomerId?: string;
  cached?: boolean;
  error?: string;
  errorCode?: string;
}

export function useMccResolver() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resolveMcc = async (targetCustomerId: string): Promise<MccResolution> => {
    setLoading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('resolve-mcc', {
        body: {
          userId: user.user.id,
          targetCustomerId: targetCustomerId.replace(/[^0-9]/g, '') // Sanitize input
        }
      });

      if (error) {
        console.error('Erro ao resolver MCC:', error);
        toast({
          title: "Erro ao resolver MCC",
          description: "Falha na comunicação com o servidor",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      if (!data.success) {
        if (data.errorCode === 'NO_MANAGING_MCC') {
          toast({
            title: "Nenhum MCC encontrado",
            description: "Nenhuma conta gerenciadora foi encontrada para esta conta. Verifique suas permissões no Google Ads.",
            variant: "destructive"
          });
        }
        return { 
          success: false, 
          error: data.error, 
          errorCode: data.errorCode 
        };
      }

      if (data.cached) {
        toast({
          title: "MCC resolvido (cache)",
          description: `Usando MCC ${data.resolvedLoginCustomerId} (informação em cache)`,
          variant: "default"
        });
      } else {
        toast({
          title: "MCC resolvido",
          description: `MCC ${data.resolvedLoginCustomerId} encontrado e será usado para esta conta`,
          variant: "default"
        });
      }

      return {
        success: true,
        resolvedLoginCustomerId: data.resolvedLoginCustomerId,
        cached: data.cached
      };

    } catch (error: any) {
      console.error('Erro ao resolver MCC:', error);
      toast({
        title: "Erro inesperado",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const clearMccCache = async (targetCustomerId: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const sanitizedCustomerId = targetCustomerId.replace(/[^0-9]/g, '');
      
      const { error } = await supabase
        .from('account_bindings')
        .delete()
        .eq('user_id', user.user.id)
        .eq('customer_id', sanitizedCustomerId);

      if (error) {
        toast({
          title: "Erro ao limpar cache",
          description: "Não foi possível limpar o cache do MCC",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Cache limpo",
        description: "Cache do MCC foi limpo. Próxima resolução será feita em tempo real.",
        variant: "default"
      });

      return true;

    } catch (error: any) {
      console.error('Erro ao limpar cache MCC:', error);
      toast({
        title: "Erro inesperado",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    resolveMcc,
    clearMccCache,
    loading
  };
}