
-- TRIGGER: Bloqueia e loga qualquer valor inválido nos enums status ou tipo de agendamento

-- Função auxiliar para validar e logar tentativas inválidas
CREATE OR REPLACE FUNCTION public.validar_enum_agendamento()
RETURNS trigger AS $$
BEGIN
  -- Verifica se status é inválido
  IF NEW.status IS NULL OR NOT (NEW.status = ANY (ARRAY['agendado', 'cancelado', 'concluido', 'pendente', 'confirmada'])) THEN
    RAISE EXCEPTION 'Valor inválido para status_agendamento: "%". Possível origem: inserção frontend/backend legada.', COALESCE(NEW.status, 'NULL');
  END IF;

  -- Verifica se tipo é inválido
  IF NEW.tipo IS NULL OR NOT (NEW.tipo = ANY (ARRAY['vaga', 'reserva'])) THEN
    RAISE EXCEPTION 'Valor inválido para tipo_agendamento: "%".', COALESCE(NEW.tipo, 'NULL');
  END IF;

  -- Se tudo válido, segue o fluxo normalmente
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove trigger anterior se existir
DROP TRIGGER IF EXISTS agendamentos_validar_enum ON public.agendamentos;

-- Cria trigger de validação para INSERT e UPDATE
CREATE TRIGGER agendamentos_validar_enum
BEFORE INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.validar_enum_agendamento();
