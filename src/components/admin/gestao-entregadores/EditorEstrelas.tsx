import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditorEstrelasProps {
  entregador: {
    id: string;
    nome: string;
    estrelas: number;
  };
  onUpdate: () => void;
}

export function EditorEstrelas({ entregador, onUpdate }: EditorEstrelasProps) {
  const [estrelas, setEstrelas] = useState(entregador.estrelas.toString());
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('entregadores')
        .update({ 
          estrelas: parseInt(estrelas),
          updated_at: new Date().toISOString()
        })
        .eq('id', entregador.id);

      if (error) throw error;

      toast.success('Estrelas atualizadas com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar estrelas:', error);
      toast.error('Erro ao atualizar estrelas');
    } finally {
      setLoading(false);
    }
  };

  const getEstrelasDisplay = (num: string) => {
    const displays = {
      '1': '★☆☆☆☆ (1 estrela)',
      '2': '★★☆☆☆ (2 estrelas)',
      '3': '★★★☆☆ (3 estrelas)',
      '4': '★★★★☆ (4 estrelas)',
      '5': '★★★★★ (5 estrelas)'
    };
    return displays[num as keyof typeof displays];
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={estrelas} onValueChange={setEstrelas}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map(num => (
            <SelectItem key={num} value={num.toString()}>
              {getEstrelasDisplay(num.toString())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        onClick={handleSave} 
        disabled={loading || estrelas === entregador.estrelas.toString()}
        size="sm"
      >
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
}