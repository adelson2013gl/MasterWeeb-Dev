import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanoSelector } from './PlanoSelector';
import { useToast } from '@/hooks/use-toast';
import { abacatePayService } from '@/services/abacatePayService';

// Mock dos hooks e serviços
vi.mock('@/hooks/use-toast');
vi.mock('@/services/abacatePayService');
vi.mock('@/utils/retry');
vi.mock('@/config/planos');

const mockToast = vi.fn();
const mockAbacatePayService = {
  createPixQrCode: vi.fn(),
  validatePaymentData: vi.fn(),
  formatCellphone: vi.fn(),
  isValidTaxId: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
  (useToast as any).mockReturnValue({ toast: mockToast });
  (abacatePayService as any).createPixQrCode = mockAbacatePayService.createPixQrCode;
  (abacatePayService as any).validatePaymentData = mockAbacatePayService.validatePaymentData;
  (abacatePayService as any).formatCellphone = mockAbacatePayService.formatCellphone;
  (abacatePayService as any).isValidTaxId = mockAbacatePayService.isValidTaxId;
});

describe('PlanoSelector - Validação de Dados', () => {
  const defaultProps = {
    empresaId: 'test-empresa-123',
    empresaNome: 'Empresa Teste',
    empresaEmail: 'teste@empresa.com',
    planoAtual: undefined,
    onPlanoSelecionado: vi.fn()
  };

  it('deve exibir dados válidos quando todas as informações estão corretas', async () => {
    render(<PlanoSelector {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Dados inválidos detectados')).not.toBeInTheDocument();
    });
  });

  it('deve exibir erro quando empresaEmail está vazio', async () => {
    render(
      <PlanoSelector 
        {...defaultProps} 
        empresaEmail="" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dados inválidos detectados')).toBeInTheDocument();
      expect(screen.getByText('Email da empresa é obrigatório')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando empresaEmail tem formato inválido', async () => {
    render(
      <PlanoSelector 
        {...defaultProps} 
        empresaEmail="email-invalido" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dados inválidos detectados')).toBeInTheDocument();
      expect(screen.getByText('Formato de email inválido')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando empresaNome está vazio', async () => {
    render(
      <PlanoSelector 
        {...defaultProps} 
        empresaNome="" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dados inválidos detectados')).toBeInTheDocument();
      expect(screen.getByText('Nome da empresa deve ter entre 2 e 100 caracteres')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando empresaId está vazio', async () => {
    render(
      <PlanoSelector 
        {...defaultProps} 
        empresaId="" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dados inválidos detectados')).toBeInTheDocument();
      expect(screen.getByText('ID da empresa é obrigatório')).toBeInTheDocument();
    });
  });

  it('deve exibir múltiplos erros quando vários campos são inválidos', async () => {
    render(
      <PlanoSelector 
        {...defaultProps} 
        empresaId=""
        empresaNome=""
        empresaEmail="email-invalido"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Dados inválidos detectados')).toBeInTheDocument();
      expect(screen.getByText('ID da empresa é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Nome da empresa deve ter entre 2 e 100 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Formato de email inválido')).toBeInTheDocument();
    });
  });

  it('deve impedir seleção de plano quando dados são inválidos', async () => {
    render(
      <PlanoSelector 
        {...defaultProps} 
        empresaEmail="" 
      />
    );
    
    // Tentar clicar em um botão de plano
    const planoButton = screen.getAllByText('Assinar Agora')[0];
    fireEvent.click(planoButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Dados inválidos',
        description: expect.stringContaining('Email da empresa é obrigatório'),
        variant: 'destructive'
      });
    });
    
    expect(mockAbacatePayService.createPixQrCode).not.toHaveBeenCalled();
  });

  it('deve abrir modal de coleta de dados quando informações estão incompletas', async () => {
    // Mock da validação indicando dados faltando
    mockAbacatePayService.validatePaymentData.mockReturnValue({
      isValid: false,
      missingFields: ['cellphone', 'taxId']
    });
    
    render(<PlanoSelector {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Dados inválidos detectados')).not.toBeInTheDocument();
    });
    
    // Clicar em um botão de plano
    const planoButton = screen.getAllByText('Assinar Agora')[0];
    fireEvent.click(planoButton);
    
    await waitFor(() => {
      expect(mockAbacatePayService.validatePaymentData).toHaveBeenCalled();
    });
  });

  it('deve exibir informações de debug em modo desenvolvimento', async () => {
    // Simular ambiente de desenvolvimento
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(<PlanoSelector {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Debug - Dados da Empresa:')).toBeInTheDocument();
      expect(screen.getByText('ID: test-empresa-123')).toBeInTheDocument();
      expect(screen.getByText('Nome: Empresa Teste')).toBeInTheDocument();
      expect(screen.getByText('Email: teste@empresa.com')).toBeInTheDocument();
    });
    
    // Restaurar ambiente original
    process.env.NODE_ENV = originalEnv;
  });
});