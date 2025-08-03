#!/bin/bash

# =====================================================
# SCRIPT PARA CORRIGIR TODOS OS NOMES DE CAMPOS
# SlotMaster → MasterWeeb
# =====================================================

echo "🔧 Iniciando correção em massa de nomes de campos..."

# Navegar para o diretório src
cd "$(dirname "$0")/../../../src" || exit 1

echo "📁 Diretório atual: $(pwd)"

# 1. Corrigir vagas_disponiveis → vagas_total
echo "🔄 Corrigindo vagas_disponiveis → vagas_total..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/vagas_disponiveis/vagas_total/g'

# 2. Corrigir agendas.data → agendas.data_agenda (se ainda houver)
echo "🔄 Corrigindo agendas.data → agendas.data_agenda..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/agendas\.data\b/agendas.data_agenda/g'

# 3. Corrigir .data no contexto de agenda
echo "🔄 Corrigindo referencias diretas data → data_agenda..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.data\b/.data_agenda/g'

# 4. Corrigir data: string em interfaces
echo "🔄 Corrigindo interfaces data: → data_agenda:..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/data: string/data_agenda: string/g'

echo "✅ Correção em massa concluída!"
echo "🧪 Execute o teste para verificar se todos os campos foram corrigidos."

# Verificar arquivos que ainda podem ter problemas
echo "🔍 Verificando arquivos que ainda podem ter campos antigos..."
echo "Arquivos com 'data:' (verificar manualmente):"
grep -r "data:" . --include="*.ts" --include="*.tsx" | head -10

echo "Arquivos com 'vagas_disponiveis' (verificar se restou algum):"
grep -r "vagas_disponiveis" . --include="*.ts" --include="*.tsx" | head -5